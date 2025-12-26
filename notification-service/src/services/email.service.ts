import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
    if (!process.env.NODEMAILER_EMAIL) {
        console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to,
        subject,
        text
    });
};

export default sendEmail;
