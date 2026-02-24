// server/utils/sendEmail.js
// Purpose: Reusable function to send emails using Nodemailer with AWS SES.

const nodemailer = require('nodemailer');
const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

// Initialize SES Client using your environment variables
const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const sendEmail = async (options) => {
    // Create a transporter using the SES client directly
    const transporter = nodemailer.createTransport({
        SES: { ses, aws: { SendRawEmailCommand } },
    });

    // Define email options
    const message = {
        from: process.env.EMAIL_FROM_ADDRESS, // Sender address (Must be verified in SES Sandbox)
        to: options.to,                       // List of receivers
        subject: options.subject,             // Subject line
        text: options.text,                   // Plain text body
        html: options.html                    // HTML body
    };

    // Send the email
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