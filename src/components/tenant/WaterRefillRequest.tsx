'use client';

import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { requestWaterRefill } from '@/app/actions/waterrefill';
import { useRouter } from 'next/navigation';

export function WaterRefillRequest() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await requestWaterRefill();
      if (res.error) throw new Error(res.error);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to request water refill. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: '0.875rem',
        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <Droplet size={18} />
      {loading ? 'Requesting...' : 'Request Water Refill'}
    </button>
  );
}
