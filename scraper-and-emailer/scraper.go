package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
	"github.com/PuerkitoBio/goquery"
)

var emailRegex = regexp.MustCompile(`(?i)[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,63}`)

type OSMNode struct {
	Tags struct {
		Name    string `json:"name"`
		Website string `json:"website"`
	} `json:"tags"`
}

type OSMResponse struct {
	Elements []OSMNode `json:"elements"`
}

const (
	MaxWorkers        = 5
	RequestDelay      = 500 * time.Millisecond
	HttpTimeout       = 20 * time.Second
	PerRequestTimeout = 10 * time.Second
	RetryTimeout      = 15 * time.Second
	MaxPagesPerSite   = 10
)

func main() {
	db, err := sql.Open("sqlite", "./emails.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Drop & create table with unique emails
	_, err = db.Exec(`DROP TABLE IF EXISTS emails`)
	if err != nil {
		log.Fatal("Failed to drop old table:", err)
	}
	_, err = db.Exec(`CREATE TABLE emails (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		shop_name TEXT,
		website TEXT,
		email TEXT UNIQUE
	)`)
	if err != nil {
		log.Fatal("Failed to create emails table:", err)
	}

	shops := getCoffeeShops()
	fmt.Println("Fetched shops from OSM:", len(shops))

	shops = uniqueShopsByDomain(shops)
	fmt.Println("Unique shops to scrape:", len(shops))

	var wg sync.WaitGroup
	shopChan := make(chan OSMNode)
	client := http.Client{Timeout: HttpTimeout}

	for i := 0; i < MaxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for shop := range shopChan {
				site := shop.Tags.Website
				if site == "" {
					continue
				}
				emails := scrapeSite(site, client)
				for _, e := range emails {
					if e == "" {
						continue
					}
					_, err := db.Exec(
						`INSERT OR IGNORE INTO emails (shop_name, website, email) VALUES (?, ?, ?)`,
						shop.Tags.Name, site, e,
					)
					if err != nil {
						log.Println("DB insert error:", err)
					} else {
						fmt.Printf("✔ %s  from %s (%s)\n", e, shop.Tags.Name, site)
					}
				}
				time.Sleep(RequestDelay)
			}
		}()
	}

	for _, shop := range shops {
		shopChan <- shop
	}
	close(shopChan)
	wg.Wait()
	fmt.Println("Scraping finished.")
}

// Fetch coffee shops from Overpass API
func getCoffeeShops() []OSMNode {
	query := `[out:json][timeout:300];
area["ISO3166-1"="GB"]->.uk;
(
  node["amenity"="cafe"](area.uk);
  node["shop"="coffee"](area.uk);
);
out;`

	resp, err := http.Post("https://overpass-api.de/api/interpreter",
		"application/x-www-form-urlencoded", strings.NewReader("data="+query))
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	var osmData OSMResponse
	if err := json.Unmarshal(body, &osmData); err != nil {
		log.Fatal(err)
	}

	shops := []OSMNode{}
	for _, node := range osmData.Elements {
		if node.Tags.Website == "" {
			continue
		}
		node.Tags.Website = normalizeURLToRoot(node.Tags.Website)
		if node.Tags.Website != "" {
			shops = append(shops, node)
		}
	}
	return shops
}

// Crawl site with fail-fast and optional retry
func scrapeSite(site string, client http.Client) []string {
	results := []string{}
	visited := map[string]bool{}
	queue := []string{site, site + "/contact", site + "/contact-us"}
	pagesCrawled := 0

	for len(queue) > 0 && pagesCrawled < MaxPagesPerSite {
		u := queue[0]
		queue = queue[1:]
		u = strings.TrimSuffix(u, "/")
		if visited[u] {
			continue
		}
		visited[u] = true

		html := fetchURL(u, client, PerRequestTimeout)
		if html == "" {
			// Retry once with longer timeout
			html = fetchURL(u, client, RetryTimeout)
		}
		if html == "" {
			fmt.Println("⏩ Skipping site due to slow/unresponsive page:", u)
			continue
		}
		pagesCrawled++

		found := extractEmails(html)
		for _, e := range found {
			if !contains(results, e) {
				results = append(results, e)
			}
		}

		doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
		if err == nil {
			doc.Find("a[href^='mailto:']").Each(func(i int, s *goquery.Selection) {
				raw, _ := s.Attr("href")
				for _, a := range parseMailto(raw) {
					a = sanitizeEmail(a)
					if a != "" && !contains(results, a) {
						results = append(results, a)
					}
				}
			})
			doc.Find("a").Each(func(i int, s *goquery.Selection) {
				href, ok := s.Attr("href")
				if !ok || href == "" {
					return
				}
				abs, ok := resolveLink(site, href)
				if ok && !visited[abs] {
					queue = append(queue, abs)
				}
			})
		}
	}
	return unique(results)
}

// Fetch URL with context timeout
func fetchURL(u string, client http.Client, timeout time.Duration) string {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, "GET", u, nil)
	resp, err := client.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return "" // timeout or canceled
		}
		log.Println("HTTP error visiting", u, ":", err)
		return ""
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return ""
	}
	return string(body)
}

// Extract emails with filtering
func extractEmails(text string) []string {
	matches := emailRegex.FindAllString(text, -1)
	cleaned := []string{}
	for _, m := range matches {
		m = sanitizeEmail(m)
		if m == "" || !strings.Contains(m, "@") || len(m) > 254 {
			continue
		}
		lower := strings.ToLower(m)
		if strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".png") ||
			strings.HasSuffix(lower, ".gif") || strings.HasSuffix(lower, ".svg") ||
			strings.HasSuffix(lower, ".webp") {
			continue
		}
		cleaned = append(cleaned, m)
	}
	return unique(cleaned)
}

// Parse mailto links
func parseMailto(raw string) []string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(strings.ToLower(raw), "mailto:")
	if i := strings.Index(raw, "?"); i >= 0 {
		raw = raw[:i]
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool { return r == ',' || r == ';' })
	out := []string{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// Sanitize email
func sanitizeEmail(e string) string {
	e = strings.TrimSpace(e)
	e = strings.Trim(e, "<>\"' ,;:()[]{}")
	e = strings.ToLower(e)
	if strings.HasPrefix(e, "mailto:") {
		e = strings.TrimPrefix(e, "mailto:")
	}
	if i := strings.Index(e, "?"); i >= 0 {
		e = e[:i]
	}
	return strings.TrimSpace(e)
}

// Resolve internal links
func resolveLink(baseSite, href string) (string, bool) {
	href = strings.TrimSpace(href)
	if href == "" || strings.HasPrefix(href, "javascript:") ||
		strings.HasPrefix(href, "mailto:") || strings.HasPrefix(href, "tel:") {
		return "", false
	}
	if strings.HasPrefix(href, "//") {
		href = "http:" + href
	} else if strings.HasPrefix(href, "/") {
		href = baseSite + href
	} else if !strings.HasPrefix(strings.ToLower(href), "http") {
		href = baseSite + "/" + href
	}
	if i := strings.Index(href, "#"); i >= 0 {
		href = href[:i]
	}
	href = strings.TrimSuffix(href, "/")
	if domainFromURL(baseSite) == domainFromURL(href) {
		return href, true
	}
	return "", false
}

func domainFromURL(s string) string {
	u, err := url.Parse(s)
	if err != nil {
		return ""
	}
	return strings.TrimPrefix(u.Hostname(), "www.")
}

func normalizeURLToRoot(site string) string {
	site = strings.TrimSpace(site)
	if site == "" {
		return ""
	}
	if !strings.HasPrefix(site, "http://") && !strings.HasPrefix(site, "https://") {
		site = "http://" + site
	}
	u, err := url.Parse(site)
	if err != nil || u.Hostname() == "" {
		return ""
	}
	scheme := u.Scheme
	if scheme == "" {
		scheme = "http"
	}
	return scheme + "://" + u.Hostname()
}

func uniqueShopsByDomain(shops []OSMNode) []OSMNode {
	seen := map[string]bool{}
	res := []OSMNode{}
	for _, s := range shops {
		if s.Tags.Website == "" {
			continue
		}
		d := domainFromURL(s.Tags.Website)
		if d == "" {
			continue
		}
		if !seen[d] {
			seen[d] = true
			res = append(res, s)
		}
	}
	return res
}

func unique(input []string) []string {
	keys := map[string]bool{}
	out := []string{}
	for _, e := range input {
		if e == "" {
			continue
		}
		if !keys[e] {
			keys[e] = true
			out = append(out, e)
		}
	}
	return out
}

func contains(slice []string, str string) bool {
	for _, s := range slice {
		if s == str {
			return true
		}
	}
	return false
}

