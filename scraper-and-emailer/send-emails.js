const sqlite3 = require("sqlite3").verbose();
import { sendEmail } from './mailer.js';
import { qrFeedbackTemplate } from './templates/qrFeedback.js';
import { renderTemplate } from './utils/renderTemplate.js';

async function SendEmailToCoffeeShop(toEmail,shopName) {
  const filled = renderTemplate(qrFeedbackTemplate, {
    shopName: shopName,
    guestType: "coffee shop guests",
  });

  await sendEmail({
    toEmail: toEMail,
    toName: toName,
    subject: filled.subject,
    textBody: filled.textBody,
    htmlBody: filled.htmlBody,
  });
}

;

// Open database
const db = new sqlite3.Database("./emails.db");

function processEmails() {
  db.serialize(() => {
    // Select unsent emails
    db.each(
      "SELECT id, shop_name, website, email FROM emails WHERE emailSent = 0",
      async (err, row) => {
        if (err) {
          console.error("Error fetching email:", err);
          return;
        }

        console.log(`Sending email to: ${row.email} (Shop: ${row.shop_name})`);
        sendEmailToCoffeeShop(${row.email},${row.shopName});
        try {
          // ---- Your real email-sending logic goes here ----
          // await fakeSendEmail(row.email);

          await sendEmailToCoffeeShop(${row.email},${row.shopName});

          // Mark as sent
          db.run(
            "UPDATE emails SET emailSent = 1 WHERE id = ?",
            [row.id],
            (err) => {
              if (err) {
                console.error("Error updating emailSent:", err);
              } else {
                console.log(`✔ Marked ${row.email} as sent`);
              }
            }
          );
        } catch (sendErr) {
          console.error(`❌ Failed to send to ${row.email}:`, sendErr);
        }
      }
    );
  });
}

// Example async "send email"
function fakeSendEmail(email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`📧 Email sent to ${email}`);
      resolve();
    }, 500); // simulate work
  });
}

processEmails();
