/**
 * Centralized beautiful email templates for RentsEasy.
 * All emails share the same premium design system.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentseasy.vercel.app';
const BRAND_GRADIENT = 'linear-gradient(135deg,#6366f1,#8b5cf6)';

/* ─── Base wrapper ─────────────────────────────────────────────────────────── */
function baseEmail({
  headerIcon,
  headerLabel,
  headerTitle,
  headerColor = BRAND_GRADIENT,
  body,
  footerNote = 'This is an automated message from RentsEasy. Please do not reply.',
}: {
  headerIcon: string;
  headerLabel: string;
  headerTitle: string;
  headerColor?: string;
  body: string;
  footerNote?: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(99,102,241,0.1);max-width:600px;width:100%;">

        <!-- ── Header ── -->
        <tr>
          <td style="background:${headerColor};padding:32px 40px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;
                       text-transform:uppercase;color:rgba(255,255,255,0.65);font-weight:600;">
              ${headerIcon}&nbsp;&nbsp;${headerLabel}
            </p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">
              ${headerTitle}
            </h1>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 40px;">
            ${body}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                    ${footerNote}
                  </p>
                </td>
                <td align="right" style="white-space:nowrap;padding-left:12px;">
                  <p style="margin:0;font-size:11px;color:#cbd5e1;font-weight:700;letter-spacing:0.05em;">
                    RENTSEASY
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─── Reusable parts ────────────────────────────────────────────────────────── */
function cta(text: string, url: string, color = BRAND_GRADIENT) {
  return `<a href="${url}"
     style="display:inline-block;margin-top:28px;padding:13px 32px;
            background:${color};color:#ffffff;text-decoration:none;
            border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.02em;">
    ${text} &rarr;
  </a>`;
}

function infoBox(rows: { label: string; value: string }[]) {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;
                 color:#64748b;font-weight:600;white-space:nowrap;padding-right:20px;">
        ${r.label}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;
                 color:#1e293b;font-weight:500;">
        ${r.value}
      </td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                      padding:4px 20px;margin:20px 0;">
    ${rowsHtml}
  </table>`;
}

function badge(text: string, color: 'green' | 'red' | 'orange' | 'blue' | 'purple' = 'purple') {
  const colors: Record<string, string> = {
    green:  'background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;',
    red:    'background:#fee2e2;color:#dc2626;border:1px solid #fecaca;',
    orange: 'background:#ffedd5;color:#ea580c;border:1px solid #fed7aa;',
    blue:   'background:#dbeafe;color:#2563eb;border:1px solid #bfdbfe;',
    purple: 'background:#ede9fe;color:#7c3aed;border:1px solid #ddd6fe;',
  };
  return `<span style="display:inline-block;${colors[color]}padding:3px 12px;
                        border-radius:999px;font-size:12px;font-weight:700;
                        letter-spacing:0.05em;text-transform:uppercase;">
    ${text}
  </span>`;
}

function bodyText(text: string) {
  return `<p style="margin:0 0 12px;font-size:15px;color:#475569;line-height:1.7;">${text}</p>`;
}

function greeting(name: string) {
  return `<p style="margin:0 0 20px;font-size:17px;color:#1e293b;font-weight:600;">Hello, ${name}! 👋</p>`;
}

/* ══════════════════════════════════════════════════════════════════════════════
   PUBLIC TEMPLATE FUNCTIONS
══════════════════════════════════════════════════════════════════════════════ */

/** 1. Welcome email sent to a new tenant */
export function welcomeEmail(params: {
  name: string;
  email: string;
  password: string;
  unitName: string;
  baseRent: number;
  moveInDate: string;
}) {
  const body = `
    ${greeting(params.name)}
    ${bodyText('Your landlord has set up an account for you on <strong>RentsEasy</strong> — your tenant portal for bills, payments, and announcements.')}
    ${infoBox([
      { label: '🏠 Unit',          value: params.unitName },
      { label: '💰 Monthly Rent',  value: `₱${params.baseRent.toLocaleString()}` },
      { label: '📅 Move-in Date',  value: new Date(params.moveInDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: '📧 Email',         value: params.email },
      { label: '🔑 Password',      value: `<code style="font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${params.password}</code>` },
    ])}
    ${bodyText('Please log in and change your password immediately.')}
    ${cta('Log In to Portal', `${SITE_URL}/login`)}
  `;
  return baseEmail({
    headerIcon: '🏠',
    headerLabel: 'Welcome Aboard',
    headerTitle: 'Your Tenant Account is Ready',
    body,
    footerNote: 'This account was created by your landlord. If you did not expect this email, please contact them directly.',
  });
}

/** 2. Monthly bill generated */
export function billGeneratedEmail(params: {
  name: string;
  period: string;
  totalDue: number;
  breakdown: { rent: number; electric: number; water: number; wifi?: number };
}) {
  const body = `
    ${greeting(params.name)}
    ${bodyText(`Your monthly bill for <strong>${params.period}</strong> has been generated and is now available in your tenant portal.`)}
    ${infoBox([
      { label: '📅 Period',            value: params.period },
      { label: '🏠 Base Rent',         value: `₱${params.breakdown.rent.toFixed(2)}` },
      { label: '⚡ Electric',           value: `₱${params.breakdown.electric.toFixed(2)}` },
      { label: '💧 Water',             value: `₱${params.breakdown.water.toFixed(2)}` },
      ...(params.breakdown.wifi ? [{ label: '📶 WiFi',  value: `₱${params.breakdown.wifi.toFixed(2)}` }] : []),
      { label: '💳 <strong>Total Due</strong>', value: `<strong style="font-size:16px;color:#6366f1;">₱${params.totalDue.toFixed(2)}</strong>` },
    ])}
    ${bodyText('Log in to view the full breakdown and submit your payment.')}
    ${cta('View My Bill', `${SITE_URL}/tenant`)}
  `;
  return baseEmail({
    headerIcon: '📄',
    headerLabel: 'New Bill',
    headerTitle: `Bill for ${params.period}`,
    body,
    footerNote: 'This is an automated billing notification from RentsEasy.',
  });
}

/** 3. Payment verified by owner */
export function paymentVerifiedEmail(params: {
  name: string;
  amount: number;
  newArrears: number;
}) {
  const body = `
    ${greeting(params.name)}
    ${badge('Payment Verified', 'green')}
    ${bodyText(`<br/>Your payment of <strong>₱${params.amount.toFixed(2)}</strong> has been reviewed and verified by your landlord.`)}
    ${infoBox([
      { label: '✅ Verified Amount',     value: `₱${params.amount.toFixed(2)}` },
      { label: '📊 Outstanding Balance', value: params.newArrears <= 0 ? '<span style="color:#16a34a;font-weight:700;">Fully Paid 🎉</span>' : `₱${params.newArrears.toFixed(2)}` },
    ])}
    ${bodyText('Thank you for your payment! Check your dashboard for the updated balance.')}
    ${cta('Go to Dashboard', `${SITE_URL}/tenant`)}
  `;
  return baseEmail({
    headerIcon: '✅',
    headerLabel: 'Payment Confirmed',
    headerTitle: `₱${params.amount.toFixed(2)} Verified`,
    headerColor: 'linear-gradient(135deg,#059669,#10b981)',
    body,
    footerNote: 'Payment verification notification from RentsEasy.',
  });
}

/** 4. Due date change approved */
export function dueDateApprovedEmail(params: {
  name: string;
  newDay: number;
  oldDay: number;
  ownerNote?: string;
}) {
  const ordinal = (n: number) => {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };
  const body = `
    ${greeting(params.name)}
    ${badge('Request Approved', 'green')}
    ${bodyText('<br/>Your due date change request has been <strong>approved</strong> by your landlord.')}
    ${infoBox([
      { label: '📅 Old Due Date', value: `${ordinal(params.oldDay)} of each month` },
      { label: '✅ New Due Date', value: `<strong>${ordinal(params.newDay)} of each month</strong>` },
    ])}
    ${params.ownerNote ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 16px;border-radius:6px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#166534;font-weight:600;">Note from landlord:</p>
      <p style="margin:4px 0 0;font-size:14px;color:#166534;">${params.ownerNote}</p>
    </div>` : ''}
    ${cta('View Dashboard', `${SITE_URL}/tenant`)}
  `;
  return baseEmail({
    headerIcon: '📅',
    headerLabel: 'Due Date Update',
    headerTitle: 'Due Date Change Approved',
    headerColor: 'linear-gradient(135deg,#059669,#10b981)',
    body,
  });
}

/** 5. Due date change rejected */
export function dueDateRejectedEmail(params: {
  name: string;
  currentDay: number;
  ownerNote?: string;
}) {
  const ordinal = (n: number) => {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };
  const body = `
    ${greeting(params.name)}
    ${badge('Request Declined', 'orange')}
    ${bodyText('<br/>Your due date change request was <strong>not approved</strong> at this time.')}
    ${infoBox([
      { label: '📅 Current Due Date', value: `${ordinal(params.currentDay)} of each month` },
    ])}
    ${params.ownerNote ? `<div style="background:#fff7ed;border-left:4px solid #f97316;padding:14px 16px;border-radius:6px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#9a3412;font-weight:600;">Note from landlord:</p>
      <p style="margin:4px 0 0;font-size:14px;color:#9a3412;">${params.ownerNote}</p>
    </div>` : ''}
    ${bodyText('You may submit a new request. If you have questions, please contact your landlord.')}
    ${cta('Go to Dashboard', `${SITE_URL}/tenant`)}
  `;
  return baseEmail({
    headerIcon: '📅',
    headerLabel: 'Due Date Update',
    headerTitle: 'Due Date Request Declined',
    headerColor: 'linear-gradient(135deg,#ea580c,#f97316)',
    body,
  });
}

/** 6. Password reset */
export function passwordResetEmail(params: { actionLink: string }) {
  const body = `
    ${bodyText('We received a request to reset the password for your <strong>RentsEasy</strong> account.')}
    ${bodyText('Click the button below to set a new password. This link is valid for <strong>24 hours</strong>.')}
    ${cta('Reset My Password', params.actionLink)}
    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;
  return baseEmail({
    headerIcon: '🔐',
    headerLabel: 'Account Security',
    headerTitle: 'Password Reset Request',
    body,
    footerNote: 'This link expires in 24 hours. If you did not request this, ignore this email.',
  });
}

/** 7. Owner alert (new payment, maintenance request, etc.) */
export function ownerAlertEmail(params: {
  subject: string;
  body: string;
  actionUrl: string;
  actionLabel?: string;
}) {
  const emailBody = `
    ${bodyText(params.body)}
    ${cta(params.actionLabel ?? 'View in Dashboard', params.actionUrl)}
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">This is an automated alert triggered by a tenant action.</p>
  `;
  return baseEmail({
    headerIcon: '🔔',
    headerLabel: 'Owner Alert',
    headerTitle: params.subject,
    body: emailBody,
    footerNote: 'Automated notification from RentsEasy.',
  });
}

/** 8. Tenant generic alert (water refill, maintenance update, etc.) */
export function tenantAlertEmail(params: {
  subject: string;
  body: string;
  actionUrl: string;
  actionLabel?: string;
}) {
  const emailBody = `
    ${bodyText(params.body)}
    ${cta(params.actionLabel ?? 'View Dashboard', params.actionUrl)}
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Automated notification from your landlord via RentsEasy.</p>
  `;
  return baseEmail({
    headerIcon: '📬',
    headerLabel: 'Notification',
    headerTitle: params.subject,
    body: emailBody,
    footerNote: 'This alert was sent by your landlord via RentsEasy.',
  });
}

/** 9. Broadcast announcement */
export function announcementEmail(params: {
  title: string;
  message: string;
}) {
  const emailBody = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#1e293b;">${params.title}</h2>
    <div style="font-size:15px;color:#475569;line-height:1.8;white-space:pre-wrap;">${params.message}</div>
    ${cta('View on Bulletin Board', `${SITE_URL}/tenant/broadcasts`)}
  `;
  return baseEmail({
    headerIcon: '📢',
    headerLabel: 'Announcement',
    headerTitle: 'New Message from Your Landlord',
    body: emailBody,
    footerNote: 'This announcement was sent to all relevant tenants via RentsEasy.',
  });
}
