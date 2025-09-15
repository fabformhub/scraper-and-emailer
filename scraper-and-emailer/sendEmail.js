// index.js
import { sendEmail } from './mailer.js';
import { qrFeedbackTemplate } from './templates/qrFeedback.js';
import { renderTemplate } from './utils/renderTemplate.js';

async function runCampaign() {
  const filled = renderTemplate(qrFeedbackTemplate, {
    shopName: "Geoff’s Coffee House",
    guestType: "coffee shop guests",
  });

  await sendEmail({
    toEmail: "irishgeoff@yahoo.com",
    toName: "Geoff",
    subject: filled.subject,
    textBody: filled.textBody,
    htmlBody: filled.htmlBody,
  });
}

runCampaign();

