'use client';

import { useState } from 'react';
import { updateTicketStatus } from '@/app/actions/maintenance';

export function UpdateTicketStatus({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    const res = await updateTicketStatus(ticketId, newStatus);
    if (res.error) alert(res.error);
    setLoading(false);
  }

  return (
    <select 
      value={currentStatus} 
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="btn btn-ghost"
      style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', height: 'auto', width: 'auto' }}
    >
      <option value="pending">Pending</option>
      <option value="open">Open</option>
      <option value="resolved">Resolved</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}
