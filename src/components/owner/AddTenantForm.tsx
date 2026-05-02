'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X } from 'lucide-react';
import type { Unit } from '@/types/database.types';

interface Props {
  units: Pick<Unit, 'id' | 'unit_name' | 'base_rent'>[];
  onClose?: () => void;
}

type Mode = 'new' | 'existing';

const DEFAULT_FORM = {
  name: '',
  email: '',
  password: '',
  unit_id: '',
  move_in_date: new Date().toISOString().split('T')[0],
  has_wifi: false,
  water_mode: 'tank' as 'tank' | 'metered',
  water_tank_rate: '',
  security_deposit: '',
  arrears: '',
  credit_balance: '',
};

export function AddTenantForm({ units, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('new');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function set(key: keyof typeof DEFAULT_FORM, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        unit_id: form.unit_id,
        move_in_date: form.move_in_date,
        has_wifi: form.has_wifi,
        water_mode: form.water_mode,
        water_tank_rate: parseFloat(form.water_tank_rate || '0'),
        security_deposit: parseFloat(form.security_deposit || '0'),
        is_existing: mode === 'existing',
        arrears: parseFloat(form.arrears || '0'),
        credit_balance: parseFloat(form.credit_balance || '0'),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
    } else {
      setSuccess(`✅ ${form.name} added successfully! They can now log in with their email and password.`);
      setForm(DEFAULT_FORM);
      router.refresh();
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.875rem',
    border: '1px solid var(--border)', borderRadius: '0.5rem',
    background: 'var(--bg-surface)', color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.3rem',
    fontSize: '0.775rem', fontWeight: 500, color: 'var(--text-secondary)',
  };
  const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '1rem', padding: '1.75rem',
      marginBottom: '1.5rem', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="#6366f1" />
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Add Tenant</h2>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
        {(['new', 'existing'] as Mode[]).map(m => (
          <button key={m} id={`mode-${m}`} type="button" onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '0.45rem 0.75rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s',
              background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-secondary)',
              boxShadow: mode === m ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
            }}>
            {m === 'new' ? '🆕 New Tenant' : '📋 Existing Tenant'}
          </button>
        ))}
      </div>

      {mode === 'existing' && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem',
          fontSize: '0.8rem', color: '#92400e',
        }}>
          📋 <strong>Existing Tenant Mode</strong> — use this for tenants already renting before the system was set up. You can record their current arrears, credit balance, and historical move-in date.
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Section: Basic Info ── */}
        <div style={{ ...gridTwo }}>
          <div>
            <label style={labelStyle} htmlFor="t-name">Full Name *</label>
            <input id="t-name" type="text" required style={inputStyle}
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Juan Dela Cruz" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="t-email">Email Address *</label>
            <input id="t-email" type="email" required style={inputStyle}
              value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="juan@email.com" />
          </div>
        </div>

        <div style={{ ...gridTwo }}>
          <div>
            <label style={labelStyle} htmlFor="t-password">
              {mode === 'new' ? 'Temporary Password *' : 'Set Password *'}
            </label>
            <input id="t-password" type="password" required style={inputStyle}
              value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Min. 6 characters" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="t-unit">Unit *</label>
            <select id="t-unit" required style={inputStyle}
              value={form.unit_id} onChange={e => set('unit_id', e.target.value)}>
              <option value="">Select unit…</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.unit_name} — ₱{u.base_rent.toLocaleString()}/mo</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ ...gridTwo }}>
          <div>
            <label style={labelStyle} htmlFor="t-movein">
              {mode === 'existing' ? 'Original Move-In Date *' : 'Move-In Date *'}
            </label>
            <input id="t-movein" type="date" required style={inputStyle}
              value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="t-deposit">Security Deposit (₱)</label>
            <input id="t-deposit" type="number" step="0.01" min="0" style={inputStyle}
              value={form.security_deposit} onChange={e => set('security_deposit', e.target.value)}
              placeholder="0" />
          </div>
        </div>

        {/* ── Section: Utilities ── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Utilities & WiFi</p>
          <div style={{ ...gridTwo }}>
            {/* Water mode */}
            <div>
              <label style={labelStyle}>Water Billing Mode</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['tank', 'metered'] as const).map(m => (
                  <button key={m} type="button" id={`water-${m}`}
                    onClick={() => set('water_mode', m)}
                    style={{
                      flex: 1, padding: '0.45rem', border: `1px solid ${form.water_mode === m ? '#6366f1' : 'var(--border)'}`,
                      borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                      background: form.water_mode === m ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: form.water_mode === m ? '#6366f1' : 'var(--text-secondary)',
                    }}>
                    {m === 'tank' ? '🪣 Tank' : '💧 Metered'}
                  </button>
                ))}
              </div>
            </div>
            {/* Tank rate */}
            {form.water_mode === 'tank' && (
              <div>
                <label style={labelStyle} htmlFor="t-tankrate">Tank Rate per Month (₱)</label>
                <input id="t-tankrate" type="number" step="0.01" min="0" style={inputStyle}
                  value={form.water_tank_rate} onChange={e => set('water_tank_rate', e.target.value)}
                  placeholder="e.g. 200" />
              </div>
            )}
          </div>
          {/* WiFi toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.75rem', userSelect: 'none' }}>
            <input id="t-wifi" type="checkbox" checked={form.has_wifi}
              onChange={e => set('has_wifi', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#6366f1' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              📶 Has WiFi subscription (rate set per unit)
            </span>
          </label>
        </div>

        {/* ── Section: Existing Tenant Financial State ── */}
        {mode === 'existing' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Current Financial State <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>(as of today)</span>
            </p>
            <div style={{ ...gridTwo }}>
              <div>
                <label style={labelStyle} htmlFor="t-arrears">Outstanding Arrears (₱)</label>
                <input id="t-arrears" type="number" step="0.01" min="0" style={inputStyle}
                  value={form.arrears} onChange={e => set('arrears', e.target.value)}
                  placeholder="Amount tenant still owes" />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Any unpaid balance from before the system
                </p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="t-credit">Credit Balance (₱)</label>
                <input id="t-credit" type="number" step="0.01" min="0" style={inputStyle}
                  value={form.credit_balance} onChange={e => set('credit_balance', e.target.value)}
                  placeholder="Advance/overpayment" />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Any advance or overpayment already made
                </p>
              </div>
            </div>
          </div>
        )}

        <button id="add-tenant-submit-btn" type="submit" disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontWeight: 600, fontSize: '0.9rem',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
            marginTop: '0.25rem',
          }}>
          <UserPlus size={17} />
          {loading ? 'Creating tenant…' : mode === 'existing' ? 'Add Existing Tenant' : 'Add New Tenant'}
        </button>
      </form>
    </div>
  );
}
