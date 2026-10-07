const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async (to, subject, htmlContent) => {
  const response = await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: "LernovaX",
      email: process.env.BREVO_SENDER_EMAIL,
    },

    to: [
      {
        email: to,
      },
    ],

    subject,
    htmlContent,
  });

  return response;
};

module.exports = sendEmail;