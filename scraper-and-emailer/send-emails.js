import sqlite3 from 'sqlite3';
sqlite3.verbose();

import { sendEmail } from './mailer.js';
import { qrFeedbackTemplate } from './templates/qrFeedback.js';
import { renderTemplate } from './utils/renderTemplate.js';

// Function to send email to a coffee shop
async function SendEmailToCoffeeShop(email, shopName) {
  const filled = renderTemplate(qrFeedbackTemplate, {
    shopName: shopName,
    guestType: "coffee shop guests",
  });

  await sendEmail({
    toEmail: email,
    toName: shopName,
    subject: filled.subject,
    textBody: filled.textBody,
    htmlBody: filled.htmlBody,
  });
}

// Open database
const db = new sqlite3.Database("./emails.db");

// Helper function to add a delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to process unsent emails
function processEmails() {
  db.all(
    "SELECT id, shop_name, website, email FROM emails WHERE emailSent = 0",
    async (err, rows) => {
      if (err) {
        console.error("Error fetching emails:", err);
        return;
      }

      for (const row of rows) {
        console.log(`Sending email to: ${row.email} (Shop: ${row.shop_name})`);
        try {
          // Send the email
          await SendEmailToCoffeeShop(row.email, row.shop_name);

          // Mark email as sent
          db.run(
            "UPDATE emails SET emailSent = 1 WHERE id = ?",
            [row.id],
            (err) => {
              if (err) console.error("Error updating emailSent:", err);
              else console.log(`✔ Marked ${row.email} as sent`);
            }
          );

          // Wait 1 second before sending the next email
          await sleep(1000);
        } catch (sendErr) {
          console.error(`❌ Failed to send to ${row.email}:`, sendErr);
        }
      }

      console.log("✅ Finished processing all emails.");
    }
  );
}

// Example async "send email" function (for testing)
// You can replace this with your real sendEmail function
function fakeSendEmail(email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`📧 Email sent to ${email}`);
      resolve();
    }, 500); // simulate work
  });
}

// Start processing emails
processEmails();

