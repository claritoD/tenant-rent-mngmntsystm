'use client';

import { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { updateUnit } from '@/app/actions/units';
import type { Unit } from '@/types/database.types';

export function EditUnitToggle({ unit }: { unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    unit_name: unit.unit_name,
    base_rent: unit.base_rent,
    wifi_rate: unit.wifi_rate,
    map_location_url: unit.map_location_url || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateUnit(unit.id, formData);
    if (res.error) alert(res.error);
    else setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="btn btn-ghost" 
        style={{ padding: '0.4rem', minWidth: 'auto' }}
        title="Edit Unit Settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Edit Unit: {unit.unit_name}</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="label">Unit Name</label>
                <input className="input" value={formData.unit_name} onChange={e => setFormData({...formData, unit_name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="label">Base Rent (₱)</label>
                <input className="input" type="number" value={formData.base_rent} onChange={e => setFormData({...formData, base_rent: parseFloat(e.target.value)})} required />
              </div>
              <div className="input-group">
                <label className="label">WiFi Rate (₱)</label>
                <input className="input" type="number" value={formData.wifi_rate} onChange={e => setFormData({...formData, wifi_rate: parseFloat(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="label">Map URL (Optional)</label>
                <input className="input" value={formData.map_location_url} onChange={e => setFormData({...formData, map_location_url: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
