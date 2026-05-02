'use client';

import { useState } from 'react';
import { ownerRecordPayment } from '@/app/actions/payments';
import { useRouter } from 'next/navigation';
import { Banknote, Smartphone, Check } from 'lucide-react';
import type { Tenant } from '@/types/database.types';

export function RecordPaymentForm({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'cash' | 'gcash'>('cash');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('method', method);

    const result = await ownerRecordPayment(formData);
    if (result.error) {
      alert(result.error);
    } else {
      alert('Payment successfully recorded and verified!');
      form.reset();
      router.refresh();
    }
    setLoading(false);
  }


  return (
    <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to bottom right, var(--bg-surface), rgba(99,102,241,0.03))' }}>
      <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Banknote size={20} className="text-primary" />
        Record Manual Payment
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        <div className="input-group">
          <label htmlFor="tenantId" className="label">Tenant</label>
          <select id="tenantId" name="tenantId" required className="input">
            <option value="">Select a tenant...</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="label">Payment Method</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              onClick={() => setMethod('cash')} 
              style={{
                flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                borderRadius: '0.5rem', border: `1px solid ${method === 'cash' ? '#10b981' : 'var(--border)'}`,
                background: method === 'cash' ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: method === 'cash' ? '#10b981' : 'var(--text-secondary)',
                fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              <Banknote size={16} /> Cash {method === 'cash' && <Check size={14} />}
            </button>
            <button 
              type="button" 
              onClick={() => setMethod('gcash')} 
              style={{
                flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                borderRadius: '0.5rem', border: `1px solid ${method === 'gcash' ? '#6366f1' : 'var(--border)'}`,
                background: method === 'gcash' ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: method === 'gcash' ? '#6366f1' : 'var(--text-secondary)',
                fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              <Smartphone size={16} /> GCash {method === 'gcash' && <Check size={14} />}
            </button>
          </div>
        </div>


        <div className="input-group">
          <label htmlFor="amount">Amount (₱)</label>
          <input id="amount" name="amount" type="number" step="0.01" min="1" required className="input" placeholder="e.g. 5000" />
        </div>

        {method === 'gcash' && (
          <div className="input-group">
            <label htmlFor="gcashRef">GCash Ref No.</label>
            <input id="gcashRef" name="gcashRef" type="text" required className="input" placeholder="0000 000 0000" />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '42px' }}>
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
