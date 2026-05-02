'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/utils/format';
import type { Payment, Tenant } from '@/types/database.types';

interface Props {
  payment: Payment & { tenant: Tenant };
  onUpdate: () => void;
}

export function PaymentRow({ payment: p, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function verify(status: 'verified' | 'rejected') {
    setLoading(true);
    await supabase.from('payments').update({
      status,
      verified_at: new Date().toISOString(),
    }).eq('id', p.id);
    onUpdate();
    setLoading(false);
  }

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{p.tenant?.name ?? '—'}</td>
      <td>₱{p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.gcash_ref}</td>
      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(p.date_submitted)}</td>
      <td>
        {p.proof_url ? (
          <a href={p.proof_url} target="_blank" rel="noreferrer"
            style={{ color: 'var(--brand-500)', fontSize: '0.8rem' }}>View</a>
        ) : '—'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button id={`verify-${p.id}`} onClick={() => verify('verified')} disabled={loading}
            className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            ✓ Verify
          </button>
          <button id={`reject-${p.id}`} onClick={() => verify('rejected')} disabled={loading}
            className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            ✗ Reject
          </button>
        </div>
      </td>
    </tr>
  );
}
