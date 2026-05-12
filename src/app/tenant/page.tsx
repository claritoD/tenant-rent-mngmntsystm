import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatPeso, formatDate, ordinal } from '@/utils/format';
import { nextAnniversaryDate } from '@/utils/billing';
import { WaterRefillRequest } from '@/components/tenant/WaterRefillRequest';
import { DueDateChangeRequest } from '@/components/tenant/DueDateChangeRequest';
import { Pin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Dashboard' };

export default async function TenantDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: tenant }, { data: latestBills }, { data: recentPayments }, { data: waterRefills }, { data: announcements }] = await Promise.all([
    supabase.from('tenants').select('*, unit:units(*)').eq('id', user.id).single(),
    supabase.from('bills').select('*').eq('tenant_id', user.id).order('bill_date', { ascending: false }).limit(3),
    supabase.from('payments').select('*').eq('tenant_id', user.id).order('date_submitted', { ascending: false }).limit(5),
    supabase.from('water_refills').select('*').eq('tenant_id', user.id).order('requested_at', { ascending: false }).limit(5),
    supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
  ]);

  if (!tenant) return <p>Tenant record not found. Contact your landlord.</p>;

  const unit = tenant.unit;
  if (!unit) return <p>Your account is not assigned to a unit. Contact your landlord.</p>;

  const nextBillDate = nextAnniversaryDate(tenant.move_in_date);
  const currentBill = latestBills?.[0];
  const pendingRefill = waterRefills?.find(r => r.status === 'pending');

  return (
    <div className="animate-enter">
      {/* Header */}
      <div className="page-header">
        <h1>Hello, {tenant.name.split(' ')[0]} 👋</h1>
        <p>Unit: <strong>{unit?.unit_name ?? '—'}</strong> · Next bill due: <strong>{formatDate(nextBillDate.toISOString())}</strong> (your {ordinal(tenant.anniversary_day)})</p>
      </div>

      {/* Announcements / Bulletin Board */}
      {announcements && announcements.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bulletin Board</h2>
            <div style={{ height: '2px', flex: 1, background: 'var(--border)', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements.map(ann => (
              <div key={ann.id} className="card" style={{ 
                padding: '1rem 1.25rem', 
                borderLeft: ann.is_pinned ? '4px solid #f59e0b' : '4px solid #6366f1', 
                background: ann.is_pinned ? 'rgba(245,158,11,0.03)' : 'rgba(99,102,241,0.02)',
                boxShadow: ann.is_pinned ? '0 4px 12px rgba(245,158,11,0.1)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ann.is_pinned && <Pin size={14} style={{ color: '#f59e0b', transform: 'rotate(45deg)' }} />}
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{ann.title}</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(ann.created_at)}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Bill Spotlight */}
      {currentBill && (
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-500) 100%)',
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <p className="section-title" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
            {currentBill.period_label} · {currentBill.is_paid ? '✅ Paid' : '⚠️ Unpaid'}
          </p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            {formatPeso(currentBill.total_due)}
          </p>
          <div className="flex-start" style={{ flexWrap: 'wrap', fontSize: '0.8rem', opacity: 0.85, gap: '1.25rem' }}>
            <span>🏠 Rent: {formatPeso(currentBill.rent_amount)}</span>
            <span>⚡ Electric: {formatPeso(currentBill.electric_amount)}</span>
            <span>💧 Water: {formatPeso(currentBill.water_amount)}</span>
            {currentBill.wifi_amount > 0 && <span>📶 WiFi: {formatPeso(currentBill.wifi_amount)}</span>}
            {currentBill.arrears_carried > 0 && <span style={{ color: '#fca5a5' }}>⚠️ Arrears: {formatPeso(currentBill.arrears_carried)}</span>}
            {currentBill.credit_applied > 0 && <span style={{ color: '#6ee7b7' }}>✨ Credit: -{formatPeso(currentBill.credit_applied)}</span>}
          </div>
          {!currentBill.is_paid && (
            <a href="/tenant/pay"
              style={{
                display: 'inline-block', marginTop: '1.25rem',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '0.5rem', padding: '0.5rem 1.25rem',
                color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
              }}>
              Pay via GCash →
            </a>
          )}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Wallet */}
        <div className="stat-card">
          <p className="section-title">Credit Balance</p>
          <p className="font-bold" style={{ fontSize: '1.5rem', color: tenant.credit_balance > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
            {formatPeso(tenant.credit_balance)}
          </p>
          <p className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>Advance payments / overpayments</p>
        </div>

        {/* Arrears */}
        <div className="stat-card">
          <p className="section-title">Outstanding Arrears</p>
          <p className="font-bold" style={{ fontSize: '1.5rem', color: tenant.arrears > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatPeso(tenant.arrears)}
          </p>
          <p className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>{tenant.arrears > 0 ? 'Will be added to your next bill' : 'No outstanding balance 🎉'}</p>
        </div>
      </div>

      {/* My Plan & Rates */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-semibold text-sm" style={{ marginBottom: '1rem' }}>My Plan & Rates</h2>
        <div className="grid-cols-auto" style={{ '--min-w': '200px' } as React.CSSProperties}>
          <div className="card-sm">
            <p className="section-title">Base Rent</p>
            <p className="text-lg font-semibold text-primary">{formatPeso(unit.base_rent)}<span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>/mo</span></p>
          </div>
          <div className="card-sm">
            <p className="section-title">WiFi</p>
            <p className="text-lg font-semibold text-primary">
              {tenant.has_wifi ? <>{formatPeso(tenant.wifi_rate)}<span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>/mo</span></> : 'Opted Out'}
            </p>
          </div>
          <div className="card-sm">
            <p className="section-title">Water Mode</p>
            <p className="text-lg font-semibold text-primary" style={{ textTransform: 'capitalize' }}>
              {tenant.water_mode} {tenant.water_mode === 'tank' && <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>({formatPeso(tenant.water_tank_rate)}/refill)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Water Supply Card */}
      {tenant.water_mode === 'tank' && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="font-semibold text-primary" style={{ color: '#1e40af', marginBottom: '0.25rem' }}>Water Supply</h2>
              <p className="text-sm text-secondary">
                Your unit uses a water tank. Request a refill when running low. Cost per refill is {formatPeso(tenant.water_tank_rate)}.
              </p>
            </div>
            <div>
              {pendingRefill ? (
                <div style={{ background: '#dbeafe', color: '#1e40af', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #bfdbfe' }}>
                  ⏳ Refill requested on {formatDate(pendingRefill.requested_at)}
                </div>
              ) : (
                <WaterRefillRequest />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Due Date Management Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="font-semibold text-primary" style={{ color: '#92400e', marginBottom: '0.25rem' }}>Due Date Settings</h2>
            <p className="text-sm text-secondary">
              Your rent is due on the <strong>{ordinal(tenant.anniversary_day)} of each month</strong>. Need to change it?
            </p>
          </div>
          <div>
            <DueDateChangeRequest currentAnniversaryDay={tenant.anniversary_day} />
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Recent Payments</h2>
        {(recentPayments ?? []).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payment history yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentPayments!.map(p => (
              <div key={p.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatPeso(p.amount)}</p>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '1rem', background: p.payment_method === 'cash' ? '#10b98122' : '#3b82f622', color: p.payment_method === 'cash' ? '#10b981' : '#3b82f6', fontWeight: 600 }}>
                      {p.payment_method === 'cash' ? 'Cash' : 'GCash'}
                    </span>
                  </div>
                  {p.payment_method === 'gcash' && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Ref: {p.gcash_ref}</p>}
                </div>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
