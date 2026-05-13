'use client';

import { useState } from 'react';
import { UserPlus, Banknote, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Droplet } from 'lucide-react';
import { quickStartTenant, type HistoricalPayment } from '@/app/actions/tenants';
import type { Unit } from '@/types/database.types';

export function QuickStartWizard({ units }: { units: Unit[] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    unit_id: '',
    move_in_date: new Date().toISOString().split('T')[0],
    has_wifi: false,
    wifi_rate: 0,
    water_mode: 'tank' as 'tank' | 'metered' | 'per_head',
    water_tank_rate: 0,
    occupants_count: 1,
    water_per_head_rate: 0,
    security_deposit: 0,
    start_electric_reading: 0,
    start_water_reading: 0,
  });

  const [payments, setPayments] = useState<HistoricalPayment[]>([
    { amount: 0, date: new Date().toISOString().split('T')[0] }
  ]);

  const addPaymentRow = () => {
    setPayments([...payments, { amount: 0, date: new Date().toISOString().split('T')[0] }]);
  };

  const handlePaymentChange = (index: number, field: keyof HistoricalPayment, value: string | number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    
    const validPayments = payments.filter(p => p.amount > 0);
    const result = await quickStartTenant({
      ...formData,
      payments: validPayments
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle2 size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account Created!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {formData.name} is now in the system with their utilities and payment history.
        </p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Add Another Tenant
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', background: step >= s ? '#6366f1' : 'var(--border)', borderRadius: '2px' }} />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <UserPlus size={24} className="text-primary" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tenant Information</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="label">Full Name</label>
              <input className="input" placeholder="Juan Dela Cruz" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="juan@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="label">Unit/Room</label>
                <select className="input" value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })}>
                  <option value="">Select unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Move-in Date</label>
                <input className="input" type="date" value={formData.move_in_date} onChange={e => setFormData({ ...formData, move_in_date: e.target.value })} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!formData.name || !formData.email || !formData.unit_id}>
              Next: Billing & Utilities <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Droplet size={24} className="text-primary" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Billing & Utilities</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Security Deposit (₱)</label>
              <input className="input" type="number" value={formData.security_deposit || ''} onChange={e => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) })} placeholder="0" />
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <label className="label">Water Mode</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button type="button" onClick={() => setFormData({ ...formData, water_mode: 'tank' })} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid', borderColor: formData.water_mode === 'tank' ? '#6366f1' : 'var(--border)', background: formData.water_mode === 'tank' ? 'rgba(99,102,241,0.1)' : 'transparent', color: formData.water_mode === 'tank' ? '#6366f1' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Water Tank</button>
                <button type="button" onClick={() => setFormData({ ...formData, water_mode: 'metered' })} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid', borderColor: formData.water_mode === 'metered' ? '#6366f1' : 'var(--border)', background: formData.water_mode === 'metered' ? 'rgba(99,102,241,0.1)' : 'transparent', color: formData.water_mode === 'metered' ? '#6366f1' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Metered</button>
                <button type="button" onClick={() => setFormData({ ...formData, water_mode: 'per_head' })} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid', borderColor: formData.water_mode === 'per_head' ? '#6366f1' : 'var(--border)', background: formData.water_mode === 'per_head' ? 'rgba(99,102,241,0.1)' : 'transparent', color: formData.water_mode === 'per_head' ? '#6366f1' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Per Head</button>
              </div>
              {formData.water_mode === 'tank' && (
                <div className="input-group">
                  <label className="label">Price per Refill (₱)</label>
                  <input className="input" type="number" value={formData.water_tank_rate || ''} onChange={e => setFormData({ ...formData, water_tank_rate: parseFloat(e.target.value) })} placeholder="e.g. 100" />
                </div>
              )}
              {formData.water_mode === 'per_head' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="label">Occupants</label>
                    <input className="input" type="number" value={formData.occupants_count || ''} onChange={e => setFormData({ ...formData, occupants_count: parseInt(e.target.value) })} placeholder="1" />
                  </div>
                  <div className="input-group">
                    <label className="label">Rate/Head (₱)</label>
                    <input className="input" type="number" value={formData.water_per_head_rate || ''} onChange={e => setFormData({ ...formData, water_per_head_rate: parseFloat(e.target.value) })} placeholder="150" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <label className="label">Starting Meter Readings (Move-in)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Electric (kWh)</label>
                  <input className="input" type="number" value={formData.start_electric_reading || ''} onChange={e => setFormData({ ...formData, start_electric_reading: parseFloat(e.target.value) })} placeholder="0.00" />
                </div>
                {formData.water_mode === 'metered' && (
                  <div className="input-group">
                    <label className="label">Water (m³)</label>
                    <input className="input" type="number" value={formData.start_water_reading || ''} onChange={e => setFormData({ ...formData, start_water_reading: parseFloat(e.target.value) })} placeholder="0.00" />
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.has_wifi} onChange={e => setFormData({ ...formData, has_wifi: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Subscribed to WiFi</span>
              </label>

              {formData.has_wifi && (
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label className="label">Monthly WiFi Rate (₱)</label>
                  <input className="input" type="number" value={formData.wifi_rate || ''} onChange={e => setFormData({ ...formData, wifi_rate: parseFloat(e.target.value) })} placeholder="e.g. 300" />
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Payment History <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Banknote size={24} className="text-primary" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record Payment History</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {payments.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <div className="input-group">
                  <label className="label">Amount (₱)</label>
                  <input className="input" type="number" value={p.amount || ''} onChange={e => handlePaymentChange(i, 'amount', parseFloat(e.target.value))} placeholder="5000" />
                </div>
                <div className="input-group">
                  <label className="label">Date Paid</label>
                  <input className="input" type="date" value={p.date} onChange={e => handlePaymentChange(i, 'date', e.target.value)} />
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ width: '100%', borderStyle: 'dashed', marginTop: '0.5rem' }} onClick={addPaymentRow}>+ Add More History</button>
          </div>
          {error && <div style={{ marginTop: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={handleFinish} disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Setup'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
