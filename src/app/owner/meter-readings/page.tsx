import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate } from '@/utils/format';
import MeterReadingForm from '@/components/owner/MeterReadingForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Meter Readings' };

export default async function MeterReadingsPage() {
  const supabase = await createClient();

  const [{ data: tenants }, { data: readings }] = await Promise.all([
    supabase.from('tenants').select('id, name, water_mode').eq('is_active', true).order('name'),
    supabase.from('meter_readings')
      .select('*, tenant:tenants(name)')
      .order('reading_date', { ascending: false })
      .limit(40),
  ]);

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Meter Readings</h1>
        <p>Enter electric and water readings (usually around the 18th of the month).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <MeterReadingForm tenants={tenants ?? []} />

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Recent Readings</h2>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Tenant</th><th>Type</th><th>Prev</th><th>Curr</th><th>Rate</th><th>Amount</th><th>Date</th></tr>
              </thead>
              <tbody>
                {(readings ?? []).map(r => {
                  const consumption = r.curr_reading - r.prev_reading;
                  const amount = consumption * r.rate_per_unit;
                  const tenant = r.tenant as { name: string } | null;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{tenant?.name ?? '—'}</td>
                      <td>
                        <span className={`badge ${r.type === 'electric' ? 'badge-active' : 'badge-pending'}`}>
                          {r.type === 'electric' ? '⚡ Elec' : '💧 Water'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.prev_reading}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.curr_reading}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₱{r.rate_per_unit}/u</td>
                      <td style={{ fontWeight: 600 }}>{formatPeso(amount)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(r.reading_date)}</td>
                    </tr>
                  );
                })}
                {!readings?.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No readings recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
