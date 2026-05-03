'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tenant } from '@/types/database.types';

type TenantBasic = Pick<Tenant, 'id' | 'name' | 'water_mode' | 'unit_id' | 'start_electric_reading' | 'start_water_reading'>;

interface Props {
  tenants: TenantBasic[];
}

export default function MeterReadingForm({ tenants }: Props) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState('');
  const [type, setType] = useState<'electric' | 'water'>('electric');
  const [prevReading, setPrevReading] = useState('');
  const [currReading, setCurrReading] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [readingDate, setReadingDate] = useState(() => {
    const d = new Date();
    d.setDate(18);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch last reading based on Tenant or Unit
  useEffect(() => {
    async function fetchLastReading() {
      if (!tenantId || !type) return;
      
      const selectedTenant = tenants.find(t => t.id === tenantId);
      if (!selectedTenant) return;

      setFetching(true);
      const supabase = createClient();
      
      // 1. Check for the LATEST reading for this specific TENANT
      const { data, error } = await supabase
        .from('meter_readings')
        .select('curr_reading, rate_per_unit')
        .eq('tenant_id', tenantId)
        .eq('type', type)
        .order('reading_date', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // We have a previous reading for this tenant
        setPrevReading(data.curr_reading.toString());
        if (!ratePerUnit || ratePerUnit === '0') setRatePerUnit(data.rate_per_unit.toString());
      } else {
        // 2. NO history for this tenant -> Use their Move-in Starting Reading
        const startingVal = type === 'electric' 
          ? selectedTenant.start_electric_reading 
          : selectedTenant.start_water_reading;
        
        setPrevReading((startingVal ?? 0).toString());
      }
      setFetching(false);
    }

    fetchLastReading();
  }, [tenantId, type, tenants, ratePerUnit]); 



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const prev = parseFloat(prevReading);
    const curr = parseFloat(currReading);
    const rate = parseFloat(ratePerUnit);

    if (prev < 0 || curr < 0 || rate < 0) {
      setError('Values cannot be negative.');
      setLoading(false);
      return;
    }
    if (curr < prev) {
      setError('Current reading cannot be less than previous reading.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from('meter_readings').insert({
      tenant_id: tenantId,
      type,
      prev_reading: parseFloat(prevReading),
      curr_reading: parseFloat(currReading),
      rate_per_unit: parseFloat(ratePerUnit),
      reading_date: readingDate,
    });

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess(true);
      setPrevReading(''); setCurrReading(''); setRatePerUnit('');
      router.refresh();
    }
    setLoading(false);
  }

  const consumption = parseFloat(currReading || '0') - parseFloat(prevReading || '0');
  const total = consumption * parseFloat(ratePerUnit || '0');

  const selectedTenant = tenants.find(t => t.id === tenantId);
  const isWaterTank = type === 'water' && selectedTenant?.water_mode === 'tank';

  return (
    <div className="card" style={{ maxWidth: '560px' }}>
      <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1.25rem' }}>Enter Reading</h2>

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem' }}>
          ✅ Reading saved successfully!
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Tenant */}
        <div>
          <label className="label" htmlFor="meter-tenant">Tenant</label>
          <select id="meter-tenant" className="input" required value={tenantId} onChange={e => setTenantId(e.target.value)}>
            <option value="">Select tenant…</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="label">Utility Type</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['electric', 'water'] as const).map(t => (
              <button key={t} type="button" id={`type-${t}`}
                onClick={() => setType(t)}
                className={`btn ${type === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}>
                {t === 'electric' ? '⚡' : '💧'} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Readings - Hide if Water Tank */}
        {isWaterTank ? (
          <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: '0.5rem', color: '#3b82f6', fontSize: '0.875rem', textAlign: 'center' }}>
            💧 This tenant is on <strong>Tank Mode</strong>. Their water billing is handled per-refill on the Water Refills dashboard, not via meter readings.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label" htmlFor="prev-reading">
                  Previous Reading {fetching && <span style={{ fontSize: '0.7rem', color: '#6366f1' }}>(fetching...)</span>}
                </label>
                <input id="prev-reading" type="number" step="0.01" min="0" className="input" required
                  disabled={fetching}
                  value={prevReading} onChange={e => setPrevReading(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="label" htmlFor="curr-reading">Current Reading</label>
                <input id="curr-reading" type="number" step="0.01" min="0" className="input" required
                  value={currReading} onChange={e => setCurrReading(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label" htmlFor="rate-per-unit">Rate per Unit (₱)</label>
                <input id="rate-per-unit" type="number" step="0.01" min="0" className="input" required
                  value={ratePerUnit} onChange={e => setRatePerUnit(e.target.value)} placeholder="e.g. 12.50" />
              </div>
              <div>
                <label className="label" htmlFor="reading-date">Reading Date</label>
                <input id="reading-date" type="date" className="input" required
                  value={readingDate} onChange={e => setReadingDate(e.target.value)} />
              </div>
            </div>

            {/* Live preview */}
            {consumption > 0 && (
              <div style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Consumption: </span>
                <strong>{consumption.toFixed(2)} units</strong>
                <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>→</span>
                <strong style={{ color: '#6366f1' }}>₱{total.toFixed(2)}</strong>
              </div>
            )}

            <button id="save-reading-btn" type="submit" className="btn btn-primary" disabled={loading}
              style={{ justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }}>
              {loading ? 'Saving…' : 'Save Reading'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
