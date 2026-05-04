import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/utils/format';
import { Calendar } from 'lucide-react';
import { DueDateChangeAction } from '@/components/owner/DueDateChangeAction';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Due Date Change Requests' };

export default async function DueDateChangeRequestsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('due_date_change_requests')
    .select('*, tenant:tenants(name)')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  const { data: reviewed } = await supabase
    .from('due_date_change_requests')
    .select('*, tenant:tenants(name)')
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false })
    .limit(20);

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Due Date Change Requests</h1>
        <p>Manage tenant requests to change their bill due date.</p>
      </div>

      {/* Pending */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Pending Requests</h2>
          {!!pending?.length && (
            <span className="badge badge-pending">{pending.length}</span>
          )}
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Current Due Date</th>
                <th>Requested Due Date</th>
                <th>Reason</th>
                <th>Requested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(pending ?? []).map(r => {
                const tenant = r.tenant as { name: string } | null;
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{tenant?.name ?? '—'}</td>
                    <td>{ordinal(r.current_anniversary_day)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--brand-600)' }}>
                      {ordinal(r.requested_anniversary_day)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.reason ? <div style={{ maxWidth: '200px' }}>{r.reason}</div> : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatDateTime(r.requested_at)}
                    </td>
                    <td>
                      <DueDateChangeAction
                        requestId={r.id}
                        tenantName={tenant?.name ?? 'Tenant'}
                        currentDay={r.current_anniversary_day}
                        requestedDay={r.requested_anniversary_day}
                      />
                    </td>
                  </tr>
                );
              })}
              {!pending?.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    <Calendar size={24} style={{ opacity: 0.5, margin: '0 auto 0.5rem' }} />
                    ✅ No pending requests!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewed History */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Review History</h2>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>From → To</th>
                <th>Status</th>
                <th>Owner Note</th>
                <th>Reviewed At</th>
              </tr>
            </thead>
            <tbody>
              {(reviewed ?? []).map(r => {
                const tenant = r.tenant as { name: string } | null;
                return (
                  <tr key={r.id}>
                    <td>{tenant?.name ?? '—'}</td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {ordinal(r.current_anniversary_day)} → {ordinal(r.requested_anniversary_day)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          r.status === 'approved'
                            ? 'verified'
                            : r.status === 'rejected'
                              ? 'rejected'
                              : 'pending'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.owner_note ? <div style={{ maxWidth: '200px' }}>{r.owner_note}</div> : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {r.reviewed_at ? formatDateTime(r.reviewed_at) : '—'}
                    </td>
                  </tr>
                );
              })}
              {!reviewed?.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    No review history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
