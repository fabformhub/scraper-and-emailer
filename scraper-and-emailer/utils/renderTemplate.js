// utils/renderTemplate.js

export function renderTemplate(template, data) {
  let subject = template.subject;
  let textBody = template.textBody;
  let htmlBody = template.htmlBody;

  for (const key in data) {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(placeholder, data[key]);
    textBody = textBody.replace(placeholder, data[key]);
    htmlBody = htmlBody.replace(placeholder, data[key]);
  }

  return { subject, textBody, htmlBody };
}

