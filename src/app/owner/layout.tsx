import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OwnerSidebar } from '@/components/shared/OwnerSidebar';
import { OwnerHeader } from '@/components/shared/OwnerHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { template: '%s | RentEase Owner', default: 'Owner Dashboard' } };

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }} className="owner-layout">
      {/* Desktop Sidebar */}
      <div className="hide-mobile" style={{ display: 'flex' }}>
        <OwnerSidebar />
      </div>

      {/* Mobile Header & Drawer */}
      <OwnerHeader />

      <main style={{ flex: 1, overflowY: 'auto' }} className="owner-main">
        {children}
      </main>
    </div>
  );
}

