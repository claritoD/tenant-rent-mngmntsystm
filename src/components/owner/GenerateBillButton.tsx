'use client';

import { useState } from 'react';
import { generateBill } from '@/app/actions/billing';
import { useRouter } from 'next/navigation';

export default function GenerateBillButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    if (!confirm('Are you sure you want to generate a bill for this tenant now? This will lock in their readings and reset their arrears/credit.')) return;
    
    setLoading(true);
    const result = await generateBill(tenantId);
    if (result.error) {
      alert(result.error);
    } else {
      alert('Bill generated successfully!');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
      {loading ? 'Generating...' : 'Generate Bill'}
    </button>
  );
}
