// templates/qrFeedback.js

export const qrFeedbackTemplate = {
  subject: "☕ See What Your {{guestType}} Really Think — Instantly!",
  textBody: `Hi {{shopName}} team,

Want to know what your {{guestType}} really think — instantly and effortlessly?  

With Fabform.io, {{shopName}} can create QR-code feedback forms in minutes — for free! (Pro version available with extra features.)

Here’s how it works:

1️⃣ Place a small QR code on your counter, tables, or receipts.  
2️⃣ {{guestType}} scan the code with their phone — no app needed.  
3️⃣ They share quick, friendly feedback about their experience.  
4️⃣ You get actionable insights in real-time to improve your drinks, service, and vibe.

Why shop owners love Fabform:
- ☕ Easy setup — no tech skills required  
- 📝 Honest feedback from {{guestType}} on drinks, service, and atmosphere  
- 📊 Track trends and see responses instantly  
- 🎨 Fully branded forms that match your style  
- 🔗 Integrates with your favorite reporting and alert tools

Turn every visit into an opportunity to learn, improve, and create happier, returning regulars.

🚀 Start collecting feedback today — it’s free: https://fabform.io

Warmly,  
The Fabform Team`,

  htmlBody: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Fabform.io — Free QR Feedback</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;color:#333;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:30px;text-align:center;">
                <h1 style="margin:0;color:#4f46e5;">☕ Fabform.io</h1>
                <p style="color:#555;font-size:16px;margin:20px 0;">
                  Discover what your <strong>{{guestType}}</strong> really think — instantly — with a simple <strong>QR-code form</strong>. <br/>
                  It’s <strong>free</strong> to get started! (Pro version available with extra features.)
                </p>

                <p style="color:#555;font-size:16px;margin:20px 0;">
                  Here’s how it works:
                </p>
                <ol style="text-align:left;color:#444;line-height:1.6;padding-left:20px;">
                  <li>Place a small QR code on your counter, tables, or receipts.</li>
                  <li>{{guestType}} scan the code with their phone — no app needed.</li>
                  <li>They share quick, friendly feedback about their visit.</li>
                  <li>{{shopName}} gets actionable insights in real-time to improve drinks, service, and vibe.</li>
                </ol>

                <p style="color:#555;font-size:16px;margin:20px 0;">
                  Why {{shopName}} will love Fabform:
                </p>
                <ul style="list-style:none;padding:0;margin:20px 0;text-align:left;color:#444;line-height:1.6;">
                  <li>☕ Easy setup — no tech skills required</li>
                  <li>📝 Honest feedback from {{guestType}}</li>
                  <li>📊 Track trends and see responses instantly</li>
                  <li>🎨 Fully branded forms to match your style</li>
                  <li>🔗 Integrates with your favorite reporting and alert tools</li>
                </ul>

                <p style="margin:30px 0;">
                  <a href="https://fabform.io" style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
                    Start Collecting Feedback — Free!
                  </a>
                </p>

                <p style="font-size:14px;color:#888;margin-top:30px;">
                  Turn every visit into an opportunity to learn, improve, and create happier, returning regulars.<br/>
                  Warmly,<br/>The Fabform Team
                </p>
              </td>
            </tr>
          </table>

          <p style="font-size:12px;color:#aaa;margin-top:15px;">
            You’re receiving this email because you subscribed to Fabform updates.
            <br/> <a href="#" style="color:#aaa;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
};

