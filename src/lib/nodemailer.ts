'use server';

import nodemailer from 'nodemailer';

// Helper to get transporter – ensures env vars are read at runtime
function getTransporter() {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string; // plain-text fallback — reduces spam score
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('⚠️ Gmail credentials not configured. Email not sent.');
      return { success: false, error: 'Gmail not configured' };
    }

    const senderName = process.env.GMAIL_SENDER_NAME ?? 'RentsEasy';
    const senderEmail = process.env.GMAIL_EMAIL!;

    const mailOptions = {
      // Proper display name reduces spam score
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      // Plain-text alternative is required for good spam scores
      text: text ?? html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim(),
      html,
      headers: {
        // Tell Gmail this is not bulk/transactional, reduces spam filtering
        'X-Mailer': 'RentsEasy Notification System',
        'X-Priority': '3',
        // List-Unsubscribe header — marks as legitimate mailing
        'List-Unsubscribe': `<mailto:${senderEmail}?subject=Unsubscribe>`,
      },
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

