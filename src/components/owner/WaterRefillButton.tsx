'use client';

import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { recordManualWaterRefill } from '@/app/actions/waterrefill';

interface WaterRefillButtonProps {
  tenantId: string;
  tenantName: string;
}

export function WaterRefillButton({ tenantId, tenantName }: WaterRefillButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRefill() {
    if (!confirm(`Are you sure you want to record a manual water tank refill for ${tenantName}? This will be added to their next bill.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await recordManualWaterRefill(tenantId);
      if (res.error) throw new Error(res.error);
      alert('Water refill recorded successfully!');
    } catch (err) {
      alert(`Failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefill}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: '1px solid #3b82f6',
        background: 'rgba(59,130,246,0.1)',
        color: '#3b82f6',
        fontWeight: 600,
        fontSize: '0.875rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.2s',
      }}
    >
      <Droplet size={16} />
      {loading ? 'Recording...' : 'Manual Water Refill'}
    </button>
  );
}
