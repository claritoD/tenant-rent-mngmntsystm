'use client';

import { useState } from 'react';
import { verifyPayment, rejectPayment } from '@/app/actions/payments';
import { useRouter } from 'next/navigation';

export function PaymentActionButtons({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify() {
    if (!confirm('Verify this payment? This will update the tenant\'s balance.')) return;
    setLoading(true);
    const res = await verifyPayment(paymentId);
    if (res.error) alert(res.error);
    else router.refresh();
    setLoading(false);
  }

  async function handleReject() {
    if (!confirm('Reject this payment?')) return;
    setLoading(true);
    const res = await rejectPayment(paymentId);
    if (res.error) alert(res.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={handleVerify} disabled={loading} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
        {loading ? '...' : '✓ Verify'}
      </button>
      <button onClick={handleReject} disabled={loading} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
        {loading ? '...' : '✗ Reject'}
      </button>
    </div>
  );
}
