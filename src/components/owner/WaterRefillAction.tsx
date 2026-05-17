'use client';

import { useState } from 'react';
import { resolveWaterRefill } from '@/app/actions/waterrefill';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPeso } from '@/utils/format';

interface Props {
  requestId: string;
  tenantId: string;
  tenantName: string;
  tankRate: number;
}

export function WaterRefillAction({ requestId, tenantId, tenantName, tankRate }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleComplete() {
    if (!confirm(`Mark ${tenantName}'s water tank as refilled for ${formatPeso(tankRate)}?`)) return;
    
    setLoading(true);
    try {
      const { error } = await resolveWaterRefill(requestId, 'completed', tankRate, tenantId, tenantName);
      if (error) throw new Error(error);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to complete request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm(`Cancel ${tenantName}'s water refill request?`)) return;
    
    setLoading(true);
    try {
      const { error } = await resolveWaterRefill(requestId, 'cancelled', undefined, tenantId, tenantName);
      if (error) throw new Error(error);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={handleComplete}
        disabled={loading}
        className="btn btn-primary"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        <CheckCircle size={14} /> Refilled
      </button>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="btn btn-ghost"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        <XCircle size={14} /> Cancel
      </button>
    </div>
  );
}
