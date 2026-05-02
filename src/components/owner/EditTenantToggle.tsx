'use client';

import { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { updateTenant } from '@/app/actions/tenants';
import type { Tenant, Unit } from '@/types/database.types';

export function EditTenantToggle({ tenant, units }: { tenant: Tenant, units: Unit[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name,
    unit_id: tenant.unit_id || '',
    move_in_date: tenant.move_in_date,
    security_deposit: tenant.security_deposit,
    water_mode: tenant.water_mode,
    water_tank_rate: tenant.water_tank_rate,
    has_wifi: tenant.has_wifi,
    arrears: tenant.arrears,
    credit_balance: tenant.credit_balance,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateTenant(tenant.id, formData);
    if (res.error) alert(res.error);
    else setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="btn btn-ghost" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Settings size={18} /> Edit Tenant
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, paddingBottom: '0.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Edit Tenant Details</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="label">Full Name</label>
                <input className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Unit/Room</label>
                  <select className="input" value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})}>
                    <option value="">Unassigned</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Move-in Date</label>
                  <input className="input" type="date" value={formData.move_in_date} onChange={e => setFormData({...formData, move_in_date: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Arrears (₱)</label>
                  <input className="input" type="number" value={formData.arrears} onChange={e => setFormData({...formData, arrears: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="label">Credit Balance (₱)</label>
                  <input className="input" type="number" value={formData.credit_balance} onChange={e => setFormData({...formData, credit_balance: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Security Deposit (₱)</label>
                  <input className="input" type="number" value={formData.security_deposit} onChange={e => setFormData({...formData, security_deposit: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="label">WiFi Access</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
                    <input type="checkbox" checked={formData.has_wifi} onChange={e => setFormData({...formData, has_wifi: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '0.875rem' }}>Subscribed to WiFi</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>Water Billing Mode</p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="water_mode" checked={formData.water_mode === 'metered'} onChange={() => setFormData({...formData, water_mode: 'metered'})} />
                    <span style={{ fontSize: '0.85rem' }}>Metered</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="water_mode" checked={formData.water_mode === 'tank'} onChange={() => setFormData({...formData, water_mode: 'tank'})} />
                    <span style={{ fontSize: '0.85rem' }}>Fixed Tank Rate</span>
                  </label>
                </div>
                {formData.water_mode === 'tank' && (
                  <div className="input-group">
                    <label className="label">Monthly Tank Rate (₱)</label>
                    <input className="input" type="number" value={formData.water_tank_rate} onChange={e => setFormData({...formData, water_tank_rate: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.5rem' }}>
                {loading ? 'Saving...' : <><Save size={18} /> Update Tenant Details</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
