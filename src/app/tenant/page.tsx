import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatPeso, formatDate, ordinal } from '@/utils/format';
import { nextAnniversaryDate } from '@/utils/billing';
import { WaterRefillRequest } from '@/components/tenant/WaterRefillRequest';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Dashboard' };

export default async function TenantDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: tenant }, { data: latestBills }, { data: recentPayments }, { data: waterRefills }] = await Promise.all([
    supabase.from('tenants').select('*, unit:units(*)').eq('id', user.id).single(),
    supabase.from('bills').select('*').eq('tenant_id', user.id).order('bill_date', { ascending: false }).limit(3),
    supabase.from('payments').select('*').eq('tenant_id', user.id).order('date_submitted', { ascending: false }).limit(5),
    supabase.from('water_refills').select('*').eq('tenant_id', user.id).order('requested_at', { ascending: false }).limit(5),
  ]);

  if (!tenant) return <p>Tenant record not found. Contact your landlord.</p>;

  const unit = (tenant as { unit: { unit_name: string; base_rent: number; wifi_rate: number } | null }).unit;
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

      {/* Current Bill Spotlight */}
      {currentBill && (
        <div style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          marginBottom: '1.5rem',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <p style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentBill.period_label} · {currentBill.is_paid ? '✅ Paid' : '⚠️ Unpaid'}
          </p>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            {formatPeso(currentBill.total_due)}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', opacity: 0.85 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Wallet */}
        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Credit Balance</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: tenant.credit_balance > 0 ? '#10b981' : 'var(--text-primary)' }}>
            {formatPeso(tenant.credit_balance)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Advance payments / overpayments</p>
        </div>

        {/* Arrears */}
        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Outstanding Arrears</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: tenant.arrears > 0 ? '#ef4444' : '#10b981' }}>
            {formatPeso(tenant.arrears)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{tenant.arrears > 0 ? 'Will be added to your next bill' : 'No outstanding balance 🎉'}</p>
        </div>
      </div>

      {/* My Plan & Rates */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>My Plan & Rates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Rent</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{formatPeso(unit.base_rent)}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WiFi</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {tenant.has_wifi ? <>{formatPeso(unit.wifi_rate)}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></> : 'Opted Out'}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Water Mode</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
              {tenant.water_mode} {tenant.water_mode === 'tank' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({formatPeso(tenant.water_tank_rate)}/refill)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Water Supply Card */}
      {tenant.water_mode === 'tank' && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontWeight: 600, fontSize: '1rem', color: '#1e40af', marginBottom: '0.25rem' }}>Water Supply</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
