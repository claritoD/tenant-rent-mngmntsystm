import nodemailer from 'nodemailer';

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('⚠️ Gmail credentials not configured. Email not sent.');
      return { success: false, error: 'Gmail not configured' };
    }

    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('❌ Email failed to send:', err);
    return { success: false, error: err };
  }
}
