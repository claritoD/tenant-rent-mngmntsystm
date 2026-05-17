'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, FileText, LogOut, Home, Wrench, Menu, X, Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/tenant',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tenant/broadcasts', label: 'Bulletin Board', icon: Megaphone },
  { href: '/tenant/pay',    label: 'Pay',        icon: CreditCard },
  { href: '/tenant/vault',  label: 'Documents',   icon: FileText },
  { href: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
];

export function TenantNav({ tenantName, unreadCount = 0 }: { tenantName: string, unreadCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '64px',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'nowrap',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>RentsEasy</span>
        </div>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }} className="hide-mobile">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isBroadcast = href === '/tenant/broadcasts';
            return (
              <Link key={href} href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.875rem', borderRadius: '0.5rem',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand-500)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                }}>
                <Icon size={14} />
                <span>{label}</span>
                {isBroadcast && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    border: '2px solid var(--bg-surface)',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} className="hide-mobile"></div>

        {/* User & logout (Desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }} className="hide-mobile">
          <ThemeToggle />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>👋 {tenantName}</span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="show-mobile btn btn-ghost" 
          style={{ padding: '0.5rem', marginLeft: 'auto', flexShrink: 0 }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            top: '64px',
            background: 'var(--bg-surface)',
            zIndex: 90,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="animate-enter"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isBroadcast = href === '/tenant/broadcasts';
            return (
              <Link key={href} href={href} onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem', borderRadius: '0.75rem',
                  textDecoration: 'none', fontSize: '1rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' : 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}>
                <Icon size={20} />
                {label}
                {isBroadcast && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    border: '2px solid #fff',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <ThemeToggle />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Signed in as {tenantName}</p>
            <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

