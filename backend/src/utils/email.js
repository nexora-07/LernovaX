const nodemailer = require('nodemailer');

const sendEmail = async(options)=>{
    const email = process.env.EMAIL;
    const password = process.env.EMAIL_PASSWORD;


    //creating email transporter

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: email,
            pass: password
        }
    });


    //configure options

    const mailOptions = {
        from: "Shopsy <officialrentdirect@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message
    };


    await transporter.sendMail(mailOptions)
};

module.exports = sendEmail;