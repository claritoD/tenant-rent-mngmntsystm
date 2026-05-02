'use client';

import { useState } from 'react';

import { Settings, X, Save, Image as ImageIcon, Trash2, Upload, Loader2 } from 'lucide-react';
import { updateUnit } from '@/app/actions/units';
import { createClient } from '@/lib/supabase/client';
import type { Unit } from '@/types/database.types';
import Image from 'next/image';

export function EditUnitToggle({ unit }: { unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    unit_name: unit.unit_name,
    base_rent: unit.base_rent,
    wifi_rate: unit.wifi_rate,
    map_location_url: unit.map_location_url || '',
    interior_photos: unit.interior_photos || [],
  });

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newPhotos = [...formData.interior_photos];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `unit_${unit.id}/${Date.now()}_${file.name}`;
      
      const { error } = await supabase.storage
        .from('units')
        .upload(path, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('units').getPublicUrl(path);
        newPhotos.push(publicUrl);
      }
    }

    setFormData({ ...formData, interior_photos: newPhotos });
    setUploading(false);
  }

  function removePhoto(index: number) {
    const newPhotos = formData.interior_photos.filter((_, i) => i !== index);
    setFormData({ ...formData, interior_photos: newPhotos });
  }

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
        title="Edit Unit Details"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, paddingBottom: '0.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Edit Unit: {unit.unit_name}</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Unit Name</label>
                  <input className="input" value={formData.unit_name} onChange={e => setFormData({...formData, unit_name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="label">Base Rent (₱)</label>
                  <input className="input" type="number" value={formData.base_rent} onChange={e => setFormData({...formData, base_rent: parseFloat(e.target.value)})} required />
                </div>
              </div>

              <div className="input-group">
                <label className="label">WiFi Rate (₱)</label>
                <input className="input" type="number" value={formData.wifi_rate} onChange={e => setFormData({...formData, wifi_rate: parseFloat(e.target.value)})} />
              </div>

              <div className="input-group">
                <label className="label">Map Location URL (Google Maps)</label>
                <input 
                  className="input" 
                  placeholder="https://maps.google.com/..."
                  value={formData.map_location_url} 
                  onChange={e => setFormData({...formData, map_location_url: e.target.value})} 
                />
              </div>

              {/* Photo Section */}
              <div>
                <label className="label">Interior Photos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {formData.interior_photos.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Image src={url} alt={`Unit photo ${i+1}`} fill style={{ objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label style={{ 
                    width: '80px', height: '80px', border: '2px dashed var(--border)', borderRadius: '0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem'
                  }}>
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={16} /> Add</>}
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                {loading ? 'Saving...' : <><Save size={18} /> Update Unit Details</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

