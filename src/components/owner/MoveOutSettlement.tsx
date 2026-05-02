'use client';

import { useState } from 'react';
import { processMoveOut } from '@/app/actions/settlement';
import { LogOut, Calculator } from 'lucide-react';
import { formatPeso } from '@/utils/format';
import type { Tenant } from '@/types/database.types';

export function MoveOutSettlement({ tenant }: { tenant: Tenant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm('This will finalize the tenant account and vacate the unit. Continue?')) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      moveOutDate: formData.get('moveOutDate') as string,
      finalElectricReading: parseFloat(formData.get('finalElectricReading') as string),
      finalWaterReading: parseFloat(formData.get('finalWaterReading') as string || '0'),
      damages: parseFloat(formData.get('damages') as string || '0'),
      returnDeposit: formData.get('returnDeposit') === 'on',
    };

    const res = await processMoveOut(tenant.id, data);
    if (res.error) {
      alert(res.error);
    } else {
      setResult(res.finalSettlement);
    }
    setLoading(false);
  }

  if (result !== null) {
    return (
      <div className="card" style={{ borderColor: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
        <h2 style={{ color: '#059669', marginBottom: '1rem' }}>✅ Move-out Processed</h2>
        <p style={{ marginBottom: '0.5rem' }}>The tenant has been archived and the unit is now vacant.</p>
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '0.5rem', border: '1px solid #10b981' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Final Settlement Amount</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: result >= 0 ? '#ef4444' : '#10b981' }}>
            {formatPeso(Math.abs(result))}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, marginLeft: '0.5rem' }}>
              {result >= 0 ? '(Tenant to Pay)' : '(Refund to Tenant)'}
            </span>
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          Refresh View
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LogOut size={20} color="#ef4444" />
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Move-out Settlement</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
          {isOpen ? 'Cancel' : 'Start Process'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
            <p><strong>Current Arrears:</strong> {formatPeso(tenant.arrears)}</p>
            <p><strong>Security Deposit:</strong> {formatPeso(tenant.security_deposit)}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Move-out Date</label>
              <input type="date" name="moveOutDate" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="input-group">
              <label>Damages/Cleaning (₱)</label>
              <input type="number" name="damages" className="input" placeholder="0.00" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Final Electric Reading</label>
              <input type="number" step="0.01" name="finalElectricReading" required className="input" placeholder="Current meter reading" />
            </div>
            <div className="input-group">
              <label>Final Water Reading</label>
              <input type="number" step="0.01" name="finalWaterReading" className="input" placeholder="Leave 0 if tank mode" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" name="returnDeposit" id="returnDeposit" defaultChecked />
            <label htmlFor="returnDeposit" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Apply Security Deposit to Final Bill?</label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#dc2626', justifyContent: 'center' }}>
            <Calculator size={18} style={{ marginRight: '0.5rem' }} />
            {loading ? 'Calculating...' : 'Finalize Settlement & Archive'}
          </button>
        </form>
      )}
    </div>
  );
}
