'use client';

import { useState } from 'react';
import { Settings, X, Save, User } from 'lucide-react';
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
    wifi_rate: tenant.wifi_rate || 0,
    arrears: tenant.arrears,
    credit_balance: tenant.credit_balance,
    start_electric_reading: tenant.start_electric_reading || 0,
    start_water_reading: tenant.start_water_reading || 0,
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
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem' }}
      >
        <Settings size={18} /> Edit Tenant
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(8px)', padding: '1.5rem'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '550px', maxHeight: '100%', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
            position: 'relative', border: '1px solid var(--border)'
          }}>
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-card)', 
              zIndex: 10, padding: '0.5rem 0'
            }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} /> Edit Tenant Profile
              </h2>
              <button 
                onClick={() => setOpen(false)} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '100%', padding: '0 0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.has_wifi} 
                      onChange={e => setFormData({...formData, has_wifi: e.target.checked})} 
                      style={{ width: '22px', height: '22px', accentColor: '#6366f1', cursor: 'pointer' }} 
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Subscribed</span>
                  </div>
                </div>
              </div>

              {formData.has_wifi && (
                <div className="input-group">
                  <label className="label">Monthly WiFi Rate (₱)</label>
                  <input className="input" type="number" value={formData.wifi_rate} onChange={e => setFormData({...formData, wifi_rate: parseFloat(e.target.value)})} />
                </div>
              )}

              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Water Billing Mode</p>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="radio" name="water_mode" checked={formData.water_mode === 'metered'} onChange={() => setFormData({...formData, water_mode: 'metered'})} style={{ accentColor: '#6366f1' }} />
                    Metered
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="radio" name="water_mode" checked={formData.water_mode === 'tank'} onChange={() => setFormData({...formData, water_mode: 'tank'})} style={{ accentColor: '#6366f1' }} />
                    Water Tank
                  </label>
                </div>
                {formData.water_mode === 'tank' && (
                  <div className="input-group">
                    <label className="label">Price per Refill (₱)</label>
                    <input className="input" type="number" value={formData.water_tank_rate} onChange={e => setFormData({...formData, water_tank_rate: parseFloat(e.target.value)})} />
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Starting Meter Readings (Move-in)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="label">Starting Electric (kWh)</label>
                    <input className="input" type="number" value={formData.start_electric_reading} onChange={e => setFormData({...formData, start_electric_reading: parseFloat(e.target.value)})} />
                  </div>
                  {formData.water_mode === 'metered' && (
                    <div className="input-group">
                      <label className="label">Starting Water (m³)</label>
                      <input className="input" type="number" value={formData.start_water_reading} onChange={e => setFormData({...formData, start_water_reading: parseFloat(e.target.value)})} />
                    </div>
                  )}
                </div>
              </div>


              <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', padding: '1rem 0', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
                  {loading ? 'Saving Changes...' : <><Save size={20} /> Update Tenant Details</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
