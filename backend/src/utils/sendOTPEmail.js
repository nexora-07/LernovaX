const sendEmail = require("./email");

const sendOTPEmail = async (email, otp) => {
  const subject = "Verify Your LernovaX Account";

  const htmlContent = `
    <h2>Welcome to LernovaX!</h2>

    <p>Your verification code is:</p>

    <h1>${otp}</h1>

    <p>This code will expire in 10 minutes.</p>

    <p>If you did not create a LernovaX account, you can ignore this email.</p>
  `;

  await sendEmail(email, subject, htmlContent);
};

module.exports = sendOTPEmail;