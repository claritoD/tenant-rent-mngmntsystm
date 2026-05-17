import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TenantNav } from '@/components/shared/TenantNav';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { template: '%s | RentsEasy', default: 'Tenant Dashboard' } };

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (user.user_metadata?.role === 'owner') redirect('/owner');

  const { data: tenant } = await (supabase as any).from('tenants').select('name, last_read_announcements_at, unit:units(property_id)').eq('id', user.id).single();

  // Fetch unread count
  const { count: unreadCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .or(`property_id.is.null${tenant?.unit?.property_id ? `,property_id.eq.${tenant.unit.property_id}` : ''}`)
    .gt('created_at', tenant?.last_read_announcements_at ?? '2000-01-01');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TenantNav tenantName={tenant?.name ?? 'Tenant'} unreadCount={unreadCount ?? 0} />
      <main className="tenant-main" style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

