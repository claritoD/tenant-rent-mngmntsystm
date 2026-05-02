'use client';

export function TicketStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string, text: string }> = {
    pending:   { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    open:      { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
    resolved:  { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    cancelled: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
  };

  const style = colors[status] || colors.pending;

  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
      borderRadius: '1rem', background: style.bg, color: style.text,
      border: `1px solid ${style.text}33`, textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
}
