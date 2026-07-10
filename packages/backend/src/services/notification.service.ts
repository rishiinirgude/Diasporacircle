import nodemailer from 'nodemailer';
import twilio from 'twilio';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export class NotificationService {
  static async sendSMS(to: string, message: string): Promise<void> {
    try {
      if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        console.log('SMS skipped (Twilio not configured):', to, message);
        return;
      }

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  }

  static async sendEmail(
    to: string,
    subject: string,
    text: string
  ): Promise<void> {
    try {
      if (!process.env.SMTP_HOST) {
        console.log('Email skipped (SMTP not configured):', to, subject);
        return;
      }

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
      });
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  }
}
