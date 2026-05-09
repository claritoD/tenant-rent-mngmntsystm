import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewTicketForm } from '@/components/tenant/NewTicketForm';
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge';
import { formatDate } from '@/utils/format';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Maintenance' };

export default async function TenantMaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tickets } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Maintenance & Repairs</h1>
        <p>Report issues with your unit and track their resolution status.</p>
      </div>

      <div className="grid-maintenance">
        <NewTicketForm />

        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', fontSize: '1.1rem' }}>Ticket History</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets && tickets.length > 0 ? (
              tickets.map(t => (
                <div key={t.id} style={{
                  padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '0.75rem', display: 'flex', gap: '1rem'
                }}>
                  {t.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt="Ticket Photo" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <TicketStatusBadge status={t.status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(t.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{t.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No tickets submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
