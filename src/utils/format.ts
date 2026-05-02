/**
 * Shared formatting utilities — currency and dates.
 */

/** Format a number as Philippine Peso: ₱1,234.56 */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format an ISO date string to a short readable form: "May 8, 2026" */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format an ISO datetime to a short datetime string: "May 8, 2026 – 3:45 PM" */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns ordinal suffix for a day number: 1 → "1st", 8 → "8th" */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
