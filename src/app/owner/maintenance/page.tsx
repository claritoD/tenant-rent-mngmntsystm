import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/utils/format';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import { UpdateTicketStatus } from '@/components/owner/UpdateTicketStatus';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Maintenance Management' };

export default async function OwnerMaintenancePage() {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*, tenant:tenants(name, unit:units(unit_name))')
    .order('created_at', { ascending: false });

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Maintenance Management</h1>
        <p>Review and track repair requests from all tenants.</p>
      </div>

      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Tenant</th><th>Unit</th><th>Description</th><th>Photo</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets && tickets.length > 0 ? (
                tickets.map(t => {
                  const tenant = t.tenant as { name: string, unit: { unit_name: string } | null } | null;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(t.created_at)}</td>
                      <td style={{ fontWeight: 600 }}>{tenant?.name}</td>
                      <td>{tenant?.unit?.unit_name}</td>
                      <td style={{ fontSize: '0.875rem', maxWidth: '300px' }}>{t.description}</td>
                      <td>
                        {t.photo_url ? (
                          <a href={t.photo_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#6366f1' }}>View Photo</a>
                        ) : '—'}
                      </td>
                      <td><TicketStatusBadge status={t.status} /></td>
                      <td>
                        <UpdateTicketStatus ticketId={t.id} currentStatus={t.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No maintenance requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
