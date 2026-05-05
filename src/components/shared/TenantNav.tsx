'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, FileText, LogOut, Home, Wrench, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/tenant',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tenant/pay',    label: 'Pay',        icon: CreditCard },
  { href: '/tenant/vault',  label: 'Documents',   icon: FileText },
  { href: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
];

export function TenantNav({ tenantName }: { tenantName: string }) {
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
        minHeight: '64px',
        gap: '1.5rem',
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
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>RentsEasy</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hide-mobile" style={{ display: 'flex', gap: '0.15rem', alignItems: 'center', flexWrap: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
                  textDecoration: 'none', fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--brand-500)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User & logout (Desktop) */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', flexShrink: 0, flexWrap: 'nowrap' }}>
          <ThemeToggle />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>👋 {tenantName}</span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.4rem 1rem', flexShrink: 0 }}>
            <LogOut size={15} /> Sign Out
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
            return (
              <Link key={href} href={href} onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem', borderRadius: '0.75rem',
                  textDecoration: 'none', fontSize: '1rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))' : 'var(--bg-base)',
                  border: '1px solid var(--border)',
                }}>
                <Icon size={20} />
                {label}
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

