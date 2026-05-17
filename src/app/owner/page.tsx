import { createClient } from '@/lib/supabase/server';
import { formatPeso } from '@/utils/format';
import { Users, CheckCircle2, Droplet, TrendingUp } from 'lucide-react';
import { DashboardCharts } from '@/components/owner/DashboardCharts';
import { DashboardAnalytics } from '@/components/owner/DashboardAnalytics';
import { DashboardSettingsForm } from '@/components/owner/DashboardSettingsForm';
import { getOrCreateDashboardSettings, getDashboardAnalytics } from '@/app/actions/dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Overview' };

export default async function OwnerOverviewPage() {
  const supabase = await createClient();
  
  // Get dashboard settings
  const settingsResult = await getOrCreateDashboardSettings();
  const settings = settingsResult.data;
  
  // Get analytics
  const analytics = await getDashboardAnalytics();

  // Fetch stats in parallel
  const [
    { count: totalTenants },
    { data: payments },
    { count: pendingRefills },
    { data: expenses },
  ] = await Promise.all([
    (supabase as any).from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    (supabase as any).from('payments').select('amount, payment_method, verified_at, date_submitted').eq('status', 'verified'),
    (supabase as any).from('water_refills').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    (supabase as any).from('expenses').select('*'),
  ]);

  const gcashCollected = (payments ?? []).filter(p => p.payment_method === 'gcash').reduce((s, p) => s + p.amount, 0);
  const cashCollected = (payments ?? []).filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const netProfit = (gcashCollected + cashCollected) - totalExpenses;

  // Process data for charts
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    return d;
  }).reverse();

  const monthlyData = last6Months.map(dateObj => {
    const monthKey = dateObj.toLocaleString('default', { month: 'short' });
    const yearKey = dateObj.getFullYear();
    const label = `${monthKey} ${yearKey}`;

    const revenue = (payments ?? []).filter(p => {
      const pDate = new Date(p.verified_at || p.date_submitted);
      return pDate.getMonth() === dateObj.getMonth() && pDate.getFullYear() === dateObj.getFullYear();
    }).reduce((s, p) => s + p.amount, 0);

    const monthlyExp = (expenses ?? []).filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === dateObj.getMonth() && eDate.getFullYear() === dateObj.getFullYear();
    }).reduce((s, e) => s + e.amount, 0);

    return { month: label, revenue, expenses: monthlyExp };
  });

  const expenseBreakdown = Object.entries(
    (expenses ?? []).reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  const stats = [
    { label: 'Active Tenants',     value: String(totalTenants ?? 0),  icon: Users,         color: '#6366f1' },
    { label: 'Net Profit',         value: formatPeso(netProfit),      icon: TrendingUp,    color: netProfit >= 0 ? '#10b981' : '#ef4444' },
    { label: 'GCash Collected',    value: formatPeso(gcashCollected), icon: CheckCircle2,  color: '#3b82f6' },
    { label: 'Cash Collected',     value: formatPeso(cashCollected),  icon: CheckCircle2,  color: '#10b981' },
  ];

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back. Here&apos;s your rental property at a glance.</p>
      </div>

      {/* Notifications */}
      {pendingRefills !== null && pendingRefills > 0 && (
        <div style={{
          background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(59,130,246,0.05))',
          border: '1px solid rgba(59,130,246,0.3)',
          borderLeft: '4px solid #3b82f6',
          borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', padding: '0.4rem' }}>
              <Droplet size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.95rem' }}>Water Refill Requested</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You have {pendingRefills} pending water tank refill request(s).</p>
            </div>
          </div>
          <a href="/owner/water-refills" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Review Requests
          </a>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts monthlyData={monthlyData} expenseCategories={expenseBreakdown} />

      {/* Analytics Dashboard */}
      {analytics && settings && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Analytics & Metrics</h2>
            <DashboardSettingsForm initialSettings={settings} />
          </div>
          
          {settings.show_revenue_chart && settings.show_payment_stats && settings.show_tenant_occupancy && (
            <DashboardAnalytics
              occupancy={analytics.occupancy}
              revenue={analytics.revenue}
              arrears={analytics.arrears}
              credit={analytics.credit}
              payments={analytics.payments}
              pending={analytics.pending}
            />
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ background: 'var(--bg-surface)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '4px', height: '16px', background: 'var(--brand-500)', borderRadius: '2px' }} />
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { href: '/owner/quick-start', label: 'Quick Start', icon: '🚀', color: '#6366f1' },
              { href: '/owner/payments', label: 'Payments', icon: '💳', color: '#f59e0b' },
              { href: '/owner/meter-readings', label: 'Meters', icon: '⚡', color: '#6366f1' },
              { href: '/owner/water-refills', label: 'Water', icon: '💧', color: '#3b82f6' },
              { href: '/owner/broadcast', label: 'Broadcast', icon: '📢', color: '#ef4444' },
              { href: '/owner/tenants', label: 'Tenants', icon: '👥', color: '#10b981' },
            ].map(({ href, label, icon, color }) => (
              <a key={href} href={href} style={{
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                padding: '1rem',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'var(--transition)',
              }} className="hover-lift">
                <span style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color }}>{icon}</span>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Billing Reminder</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
            📅 <strong>Utility readings</strong> are due on the <strong>18th</strong> of each month.<br /><br />
            🏠 Each tenant&apos;s <strong>rent + WiFi + arrears</strong> bill generates on their individual <strong>anniversary date</strong>.<br /><br />
            ✅ Verify GCash payments under <strong>Payments</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
