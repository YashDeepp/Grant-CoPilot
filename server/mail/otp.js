import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_SECRET
    }
});

const sendOTP = ({ to, otp }) => {
    const html = generateOTPTemplate(otp);
    const subject = 'Your OTP from GE CoPilot™';

    const options = {
        from: `GE CoPilot™ <${process.env.MAIL_EMAIL}>`,
        to,
        subject,
        html
    };

    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Email sent: ', info.response);
        }
    });
};

const generateOTPTemplate = (otp) => {
    const template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP from GE CoPilot™</title>
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;padding: 2rem;height: auto;">
            <main style="background: #FFFFFF;">
                <div>
                    <img src="https://ci3.googleusercontent.com/proxy/RGGaxLm0ifN5YB6SrijKMz6G2lcKMcrApU1aWOvkSRSUclVDoY0yw2_WK4rwbxXMcXE-wpYZqoDcsxiDLS_CKp5IzdMw9toGr0_XwEOG5i4RqySValLO7A=s0-d-e1-ft#https://cdn.openai.com/API/logo-assets/openai-logo-email-header-1.png" width="560" height="168" alt="OpenAI" title="" style="width:140px;height:auto;border:0;line-height:100%;outline:none;text-decoration:none" class="CToWUd" data-bit="iit">
                    <h1 style="color: #202123;font-size: 32px;line-height: 40px;">Your OTP is: ${otp}</h1>
                    <p style="color: #353740;font-size: 16px;line-height: 24px;margin-bottom: 1.8rem;">Use this OTP to proceed with your action.</p>
                </div>
            </main>
        </body>
        </html>
    `;

    return template;
};

export default sendOTP;
