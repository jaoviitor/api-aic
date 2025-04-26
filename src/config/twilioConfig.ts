import dotenv from 'dotenv';
dotenv.config();

export const twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    apiKey: process.env.TWILIO_API_KEY || '',
    apiSecret: process.env.TWILIO_API_SECRET || '',
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID || '',
    callerId: process.env.TWILIO_CALLER_ID || '',
};

export function nameGenerator() {
    return `user${Math.floor(Math.random() * 1000)}`;
};