import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export const sendSMS = async (to: string, message: string): Promise<void> => {
    if (!client || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`[SMS MOCK] To: ${to}, Message: ${message}`);
        return;
    }

    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
    });
};

export default sendSMS;
