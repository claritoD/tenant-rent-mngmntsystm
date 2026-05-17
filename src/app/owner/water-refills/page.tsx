import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDateTime } from '@/utils/format';
import { Droplet } from 'lucide-react';
import { WaterRefillAction } from '@/components/owner/WaterRefillAction';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Water Refills' };

export default async function WaterRefillsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('water_refills')
    .select('*, tenant:tenants(name, water_tank_rate)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  const { data: recent } = await supabase
    .from('water_refills')
    .select('*, tenant:tenants(name)')
    .neq('status', 'pending')
    .order('completed_at', { ascending: false })
    .limit(20);

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Water Refill Requests</h1>
        <p>Manage tenant requests for water tank refills.</p>
      </div>

      {/* Pending */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Pending Refills</h2>
          {!!pending?.length && (
            <span className="badge badge-pending">{pending.length}</span>
          )}
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Tenant</th><th>Requested At</th><th>Cost (Locked)</th><th>Action</th></tr>
            </thead>
            <tbody>
              {(pending ?? []).map(r => {
                const tenant = r.tenant as { name: string, water_tank_rate: number } | null;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{tenant?.name ?? '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(r.requested_at)}</td>
                    <td style={{ fontWeight: 600 }}>{formatPeso(tenant?.water_tank_rate || 0)}</td>
                    <td>
                      <WaterRefillAction 
                        requestId={r.id} 
                        tenantId={r.tenant_id}
                        tenantName={tenant?.name ?? 'Tenant'} 
                        tankRate={tenant?.water_tank_rate || 0} 
                      />
                    </td>
                  </tr>
                );
              })}
              {!pending?.length && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  <Droplet size={24} style={{ opacity: 0.5, margin: '0 auto 0.5rem' }} />
                  ✅ All water tanks are full! No pending requests.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent History */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Recent History</h2>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Tenant</th><th>Status</th><th>Amount</th><th>Completed At</th></tr>
            </thead>
            <tbody>
              {(recent ?? []).map(r => {
                const tenant = r.tenant as { name: string } | null;
                return (
                  <tr key={r.id}>
                    <td>{tenant?.name ?? '—'}</td>
                    <td><span className={`badge badge-${r.status === 'completed' ? 'verified' : 'rejected'}`}>{r.status}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.amount !== null ? formatPeso(r.amount) : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.completed_at ? formatDateTime(r.completed_at) : '—'}</td>
                  </tr>
                );
              })}
              {!recent?.length && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No recent history.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
