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

  const { data: tenant } = await supabase.from('tenants').select('name').eq('id', user.id).single();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <TenantNav tenantName={tenant?.name ?? 'Tenant'} />
      <main className="tenant-main" style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

