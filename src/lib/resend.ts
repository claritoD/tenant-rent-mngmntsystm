import { Resend } from 'resend';

// Only instantiate if API key is provided, otherwise export a dummy client
// This prevents the app from crashing if the landlord hasn't set up Resend yet.
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
