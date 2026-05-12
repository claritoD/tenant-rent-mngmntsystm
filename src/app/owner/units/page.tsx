import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate } from '@/utils/format';
import Image from 'next/image';
import { AddUnitToggle } from '@/components/owner/AddUnitToggle';
import { MapPin, Image as ImageIcon, Home } from 'lucide-react';
import { EditUnitToggle } from '@/components/owner/EditUnitToggle';
import { DeleteUnitButton } from '@/components/owner/DeleteUnitButton';
import { PropertyManager } from '@/components/owner/PropertyManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Units' };

export default async function UnitsPage() {
  const supabase = await createClient();

  // Fetch all units and properties
  const [{ data: units }, { data: properties }] = await Promise.all([
    supabase.from('units').select('*, property:properties(*)').order('created_at', { ascending: false }),
    supabase.from('properties').select('*').order('name'),
  ]);

  const unitsByProperty = (properties ?? []).map(prop => ({
    ...prop,
    units: (units ?? []).filter(u => u.property_id === prop.id)
  }));

  const orphanedUnits = (units ?? []).filter(u => !u.property_id);

  return (
    <div className="animate-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Properties & Units</h1>
          <p>Manage your buildings and the individual rooms inside them.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <PropertyManager />
          <AddUnitToggle />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {unitsByProperty.map((prop) => (
          <section key={prop.id}>
            <div style={{ marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>🏢 {prop.name}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{prop.address || 'No address set'}</p>
            </div>

            <div className="grid-cols-auto" style={{ '--min-w': '320px' } as React.CSSProperties}>
              {prop.units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
              {prop.units.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No rooms added to this building yet.</p>
              )}
            </div>
          </section>
        ))}

        {orphanedUnits.length > 0 && (
          <section>
            <div style={{ marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>❓ Uncategorized Units</h2>
            </div>
            <div className="grid-cols-auto" style={{ '--min-w': '320px' } as React.CSSProperties}>
              {orphanedUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          </section>
        )}

        {!properties?.length && !units?.length && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: '1rem', color: 'var(--text-muted)' }}>
            <Home size={32} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
            <p>No units or buildings added yet. Click &quot;Add Unit&quot; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UnitCard({ unit }: { unit: any }) {
  return (
    <div className="card animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="flex-between">
        <div className="flex-start">
          <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.5rem' }}>
            <Home size={18} color="var(--brand-500)" />
          </div>
          <div>
            <h3 className="font-bold text-primary">{unit.unit_name}</h3>
            <p className="text-muted text-xs">Room / Unit</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">{formatPeso(unit.base_rent)}</p>
          <p className="text-muted text-xs">Monthly Rent</p>
        </div>
      </div>

      {/* Image Header */}
      <div style={{
        height: '160px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        borderRadius: '0.5rem', overflow: 'hidden'
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
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Added {formatDate(unit.created_at)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <EditUnitToggle unit={unit} />
            <DeleteUnitButton unitId={unit.id} name={unit.unit_name} />
          </div>
        </div>
      </div>
    </div>
  );
}
