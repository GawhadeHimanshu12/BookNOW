// server/utils/sendEmail.js

const nodemailer = require('nodemailer');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        SES: { ses, aws: { SendRawEmailCommand } },
    });

    const message = {
        from: process.env.EMAIL_FROM_ADDRESS, 
        to: options.to,                   
        subject: options.subject,          
        text: options.text,          
        html: options.html        
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('AWS SES Email sent successfully. Message ID:', info.messageId);
        return { success: true, info };
    } catch (error) {
        console.error('Error sending email via AWS SES:', error);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
};

module.exports = sendEmail;