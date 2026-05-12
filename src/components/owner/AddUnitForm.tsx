'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, X, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/utils/image';

interface Props {
  onClose?: () => void;
}

interface Property {
  id: string;
  name: string;
}

const DEFAULT_FORM = {
  unit_name: '',
  base_rent: '',
  map_location_url: '',
  property_id: '',
};

export function AddUnitForm({ onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [properties, setProperties] = useState<Property[]>([]);
  const [interiorFiles, setInteriorFiles] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch properties for selection
  useEffect(() => {
    async function loadProperties() {
      const { data } = await supabase.from('properties').select('id, name').order('name');
      if (data) {
        setProperties(data);
      }
    }
    loadProperties();
  }, [supabase]);

  function set(key: keyof typeof DEFAULT_FORM, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('units')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('units')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Check Auth (ensure we are owner)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 2. Compress and Upload Interior Photos
      const interiorUrls: string[] = [];
      for (const file of interiorFiles) {
        const compressed = await compressImage(file);
        const url = await uploadFile(compressed, 'interiors');
        interiorUrls.push(url);
      }

      // 4. Insert Unit into database
      const { error: insertError } = await supabase.from('units').insert({
        unit_name: form.unit_name.trim(),
        base_rent: parseFloat(form.base_rent || '0'),
        interior_photos: interiorUrls,
        map_location_url: form.map_location_url.trim() || null,
        property_id: form.property_id || null,
      });

      if (insertError) throw insertError;

      setSuccess(`✅ ${form.unit_name} added successfully!`);
      setForm(DEFAULT_FORM);
      setInteriorFiles([]);
      router.refresh();
      
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong while adding the unit.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={20} color="#8b5cf6" />
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Add New Unit</h2>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

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
        <div style={{ ...gridTwo }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="u-prop">Property / Building</label>
            <select id="u-prop" style={inputStyle}
              value={form.property_id} onChange={e => set('property_id', e.target.value)}>
              <option value="">No Building (Stand-alone Unit)</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="u-name">Unit Name / Identifier *</label>
            <input id="u-name" type="text" required style={inputStyle}
              value={form.unit_name} onChange={e => set('unit_name', e.target.value)}
              placeholder="e.g., Apt 101, Room A" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="u-rent">Base Rent (₱) *</label>
            <input id="u-rent" type="number" step="0.01" min="0" required style={inputStyle}
              value={form.base_rent} onChange={e => set('base_rent', e.target.value)}
              placeholder="0.00" />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Photos & Media</p>
          
          <div style={{ ...gridTwo }}>
            {/* Map URL */}
            <div>
              <label style={labelStyle} htmlFor="u-map">Map Location (Google Maps URL)</label>
              <input id="u-map" type="url" style={inputStyle}
                value={form.map_location_url} onChange={e => set('map_location_url', e.target.value)}
                placeholder="https://maps.google.com/..." />
            </div>

            {/* Interior Photos */}
            <div>
              <label style={labelStyle}>Interior Photos</label>
              <div style={{
                border: '1px dashed var(--border)', borderRadius: '0.5rem', padding: '1rem',
                textAlign: 'center', background: 'var(--bg-surface)'
              }}>
                <input type="file" accept="image/*" id="interior-upload" multiple
                  onChange={e => setInteriorFiles(Array.from(e.target.files || []))}
                  style={{ display: 'none' }} />
                <label htmlFor="interior-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={20} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {interiorFiles.length > 0 ? `${interiorFiles.length} photos selected` : 'Click to select multiple photos'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'var(--brand-700)' : 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            color: '#fff', fontWeight: 600, fontSize: '0.9rem',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(139,92,246,0.35)',
            marginTop: '0.5rem',
          }}>
          <Home size={17} />
          {loading ? 'Uploading & Saving...' : 'Add Unit'}
        </button>
      </form>
    </div>
  );
}
