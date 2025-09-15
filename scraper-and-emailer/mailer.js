// mailer.js
import Mailjet from 'node-mailjet';

const APIKEY_PUBLIC = '2e00568a310e08959346853e95be28f0';
const APIKEY_PRIVATE = '829441c07845867ae18f5a6bcf9326b4';

const mailjet = Mailjet.apiConnect(APIKEY_PUBLIC, APIKEY_PRIVATE);

/**
 * Generic function to send an email via Mailjet
 */
export async function sendEmail({ toEmail, toName, subject, textBody, htmlBody }) {
  try {
    const response = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: "info@fabform.io",
              Name: "The Fabform Team",
            },
            To: [
              {
                Email: toEmail,
                Name: toName,
              },
            ],
            Subject: subject,
            TextPart: textBody,
            HTMLPart: htmlBody,
          },
        ],
      });

    console.log("✅ Email sent:", response.body);
    return response.body;
  } catch (err) {
    console.error("❌ Error sending email:");
    console.error("Status:", err.statusCode);
    console.error("Response:", err.response?.text || err);
    throw err;
  }
}

