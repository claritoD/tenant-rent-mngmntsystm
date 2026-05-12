'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Zap,
  CreditCard,
  LogOut,
  Home,
  ChevronRight,
  Settings,
  Wrench,
  Receipt,
  Calendar,
  Megaphone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/owner',              label: 'Overview',       icon: LayoutDashboard },
  { href: '/owner/units',        label: 'Units',          icon: Home },
  { href: '/owner/tenants',      label: 'Tenants',        icon: Users },
  { href: '/owner/meter-readings', label: 'Meter Readings', icon: Zap },
  { href: '/owner/billing',      label: 'Billing',        icon: Zap },
  { href: '/owner/payments',     label: 'Payments',       icon: CreditCard },
  { href: '/owner/maintenance',  label: 'Maintenance',    icon: Wrench },
  { href: '/owner/expenses',     label: 'Expenses',       icon: Receipt },
  { href: '/owner/due-date-requests', label: 'Due Date Requests', icon: Calendar },
  { href: '/owner/broadcast',    label: 'Broadcast',      icon: Megaphone },
  { href: '/owner/settings',     label: 'Settings',       icon: Settings },
];

export function OwnerSidebar({ isMobile, onNav }: { isMobile?: boolean, onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100vh',
      height: '100vh',
      position: isMobile ? 'relative' : 'sticky',
      top: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>RentsEasy</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/owner' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNav}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                boxShadow: isActive ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} />
              {label}
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.9rem' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

