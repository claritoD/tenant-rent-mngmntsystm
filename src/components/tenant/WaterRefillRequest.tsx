'use client';

import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function WaterRefillRequest() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleRequest() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('water_refills').insert({
        tenant_id: user.id,
        status: 'pending',
      });

      if (error) throw error;
      
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
      }}
    >
      <Droplet size={18} />
      {loading ? 'Requesting...' : 'Request Water Refill'}
    </button>
  );
}
