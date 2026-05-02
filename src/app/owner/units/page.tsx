import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate } from '@/utils/format';
import Image from 'next/image';
import { AddUnitToggle } from '@/components/owner/AddUnitToggle';
import { MapPin, Image as ImageIcon, Home } from 'lucide-react';
import { DeleteUnitButton } from '@/components/owner/DeleteUnitButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Units' };

export default async function UnitsPage() {
  const supabase = await createClient();

  // Fetch all units
  const { data: units } = await supabase
    .from('units')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="animate-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Properties & Units</h1>
          <p>Manage your rental units, base rates, and property media.</p>
        </div>
        <AddUnitToggle />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {(units ?? []).map(unit => (
          <div key={unit.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Image Header */}
            <div style={{
              height: '160px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              {unit.interior_photos && unit.interior_photos.length > 0 ? (
                <Image 
                  src={unit.interior_photos[0]} 
                  alt={unit.unit_name} 
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem' }}>No interior photos</span>
                </div>
              )}
              {unit.interior_photos?.length > 1 && (
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backdropFilter: 'blur(4px)', zIndex: 1 }}>
                  + {unit.interior_photos.length - 1} more
                </div>
              )}
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{unit.unit_name}</h3>
                <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.2)' }}>
                  {formatPeso(unit.base_rent)}/mo
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>WiFi Rate</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{unit.wifi_rate > 0 ? formatPeso(unit.wifi_rate) : 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Added</span>
                  <span>{formatDate(unit.created_at)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {unit.map_location_url ? (
                  <a href={unit.map_location_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                    <MapPin size={14} /> View Map
                  </a>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <MapPin size={14} /> No map location
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DeleteUnitButton unitId={unit.id} name={unit.unit_name} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {!units?.length && (
           <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: '1rem', color: 'var(--text-muted)' }}>
             <Home size={32} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
             <p>No units added yet. Click &quot;Add Unit&quot; to get started.</p>
           </div>
        )}
      </div>
    </div>
  );
}
