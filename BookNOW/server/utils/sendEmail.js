const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },  
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
        console.log('Email sent successfully. Message ID:', info.messageId);
        
        
        return { success: true, info };
    } catch (error) {
        console.error('Error sending email:', error);
        
        throw new Error(`Email could not be sent: ${error.message}`);
        
    }
};

module.exports = sendEmail;