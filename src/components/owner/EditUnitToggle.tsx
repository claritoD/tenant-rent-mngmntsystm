'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Save, Image as ImageIcon, Trash2, Upload, Loader2 } from 'lucide-react';
import { updateUnit } from '@/app/actions/units';
import { createClient } from '@/lib/supabase/client';
import type { Unit } from '@/types/database.types';
import Image from 'next/image';
import { compressImage } from '@/utils/image';

export function EditUnitToggle({ unit }: { unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    unit_name: unit.unit_name,
    base_rent: unit.base_rent,
    map_location_url: unit.map_location_url || '',
    interior_photos: unit.interior_photos ?? [],
    property_id: unit.property_id || '',
  });

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      const { data } = await supabase.from('properties').select('id, name').order('name');
      if (data) setProperties(data);
    }
    loadProperties();
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newPhotos = [...formData.interior_photos];

    for (let i = 0; i < files.length; i++) {
      const file = await compressImage(files[i]);
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
    const dataToSubmit = {
      ...formData,
      property_id: formData.property_id || null,
    };
    const res = await updateUnit(unit.id, dataToSubmit);
    if (res.error) alert(res.error);
    else setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="btn btn-ghost" 
        style={{ padding: '0.4rem', minWidth: 'auto', borderRadius: '0.5rem' }}
        title="Edit Unit Details"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(8px)', padding: '1.5rem'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '500px', maxHeight: '100%', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
            position: 'relative', border: '1px solid var(--border)',
            padding: '0 1.5rem 1.5rem'
          }}>
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-card)', 
              zIndex: 10, padding: '1rem 0', borderBottom: '1px solid var(--border)'
            }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Edit Unit Details</h2>
              <button 
                onClick={() => setOpen(false)} 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🏢 Building / Property (Optional)
                  </label>
                  <select 
                    className="input" 
                    value={formData.property_id} 
                    onChange={e => setFormData({...formData, property_id: e.target.value})} 
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <option value="">No Building (Stand-alone Unit)</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="label">Unit Name / #</label>
                    <input 
                      className="input" 
                      value={formData.unit_name} 
                      onChange={e => setFormData({...formData, unit_name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label className="label">Base Rent (₱)</label>
                    <input 
                      className="input" 
                      type="number" 
                      value={formData.base_rent} 
                      onChange={e => setFormData({...formData, base_rent: parseFloat(e.target.value)})} 
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="label">Map Location URL</label>
                  <input 
                    className="input" 
                    placeholder="Google Maps link..."
                    value={formData.map_location_url} 
                    onChange={e => setFormData({...formData, map_location_url: e.target.value})} 
                  />
                </div>
              </div>

              {/* Photo Section */}
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <label className="label" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <ImageIcon size={16} /> Interior Photos
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem' }}>
                  {formData.interior_photos.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Image src={url} alt={`Unit photo ${i+1}`} fill style={{ objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px', cursor: 'pointer', display: 'flex' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <label style={{ 
                    aspectRatio: '1/1', border: '2px dashed var(--border)', borderRadius: '0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem', transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : <><Upload size={18} /> Add</>}
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-card)', paddingTop: '1rem', paddingBottom: '1rem', borderTop: '1px solid var(--border)', zIndex: 10 }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                  {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
