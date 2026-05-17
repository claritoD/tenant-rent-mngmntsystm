import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate, formatDateTime } from '@/utils/format';
import { notFound } from 'next/navigation';
import { VaultUpload } from '@/components/owner/VaultUpload';
import { DeleteTenantButton } from '@/components/owner/DeleteTenantButton';
import { ArchiveTenantButton } from '@/components/owner/ArchiveTenantButton';
import { EditTenantToggle } from '@/components/owner/EditTenantToggle';
import { MoveOutSettlement } from '@/components/owner/MoveOutSettlement';
import { WaterRefillButton } from '@/components/owner/WaterRefillButton';
import { ResetPasswordButton } from '@/components/owner/ResetPasswordButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tenant Details' };

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tenant }, { data: bills }, { data: payments }, { data: vaultDocs }, { data: allUnits }, { data: unbilledRefills }] = await Promise.all([
    (supabase as any).from('tenants').select('*, unit:units(*)').eq('id', id).single(),
    (supabase as any).from('bills').select('*').eq('tenant_id', id).order('bill_date', { ascending: false }).limit(12),
    (supabase as any).from('payments').select('*').eq('tenant_id', id).order('date_submitted', { ascending: false }).limit(20),
    supabase.storage.from('vault').list(id),
    (supabase as any).from('units').select('*').order('unit_name'),
    (supabase as any).from('water_refills').select('*').eq('tenant_id', id).eq('status', 'completed').eq('billed', false),
  ]);

  if (!tenant) notFound();
  const unit = tenant.unit;

  return (
    <div className="animate-enter">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{tenant.name}</h1>
          <p>Unit: {unit?.unit_name ?? 'Unassigned'} · Move-in: {formatDate(tenant.move_in_date)} · {tenant.is_active ? 'Active' : 'Archived'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {tenant.is_active && tenant.water_mode === 'tank' && (
            <WaterRefillButton tenantId={id} tenantName={tenant.name} />
          )}
          {tenant.is_active && <ResetPasswordButton tenantId={id} tenantName={tenant.name} />}
          {tenant.is_active && <EditTenantToggle tenant={tenant} units={allUnits ?? []} />}
          {tenant.is_active && <ArchiveTenantButton tenantId={id} name={tenant.name} />}
        </div>

      </div>

      {/* Profile cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Base Rent',      value: formatPeso(unit?.base_rent ?? 0) },
          { label: 'Arrears',        value: formatPeso(tenant.arrears),       highlight: tenant.arrears > 0 ? '#ef4444' : undefined },
          { label: 'Credit Balance', value: formatPeso(tenant.credit_balance), highlight: tenant.credit_balance > 0 ? '#10b981' : undefined },
          { label: 'Water Mode',     value: tenant.water_mode === 'metered' ? 'Metered' : `Tank (${formatPeso(tenant.water_tank_rate)}/refill)` },
          { label: 'WiFi',           value: tenant.has_wifi ? `Yes · ${formatPeso(tenant.wifi_rate)}/mo` : 'No' },
          { label: 'Deposit',        value: formatPeso(tenant.security_deposit) },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</p>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: highlight ?? 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>
      
      {tenant.is_active && <MoveOutSettlement tenant={tenant} />}

      {/* Live Payables Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--border-hover)', background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg-base))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Live Payables Breakdown</h2>
          <span className="badge badge-pending">Next Bill Preview</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fixed Monthly</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Base Rent:</span>
                <span style={{ fontWeight: 600 }}>{formatPeso(unit?.base_rent ?? 0)}</span>
              </div>
              {tenant.has_wifi && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>WiFi:</span>
                  <span style={{ fontWeight: 600 }}>{formatPeso(tenant.wifi_rate)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#ef4444' }}>
                <span>Arrears:</span>
                <span style={{ fontWeight: 600 }}>{formatPeso(tenant.arrears)}</span>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Accumulation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Tank Refills ({unbilledRefills?.length ?? 0}x):</span>
                <span style={{ fontWeight: 600 }}>{formatPeso((unbilledRefills ?? []).reduce((s, r) => s + (r.amount || 0), 0))}</span>
              </div>
              {unbilledRefills && unbilledRefills.length > 0 && (
                <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem', borderLeft: '2px solid var(--border)', paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {unbilledRefills.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{formatDate(r.completed_at)}</span>
                      <span>{formatPeso(r.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                * Electric/Metered water added during billing.
              </p>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Estimated Total</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatPeso(
                (unit?.base_rent ?? 0) + 
                (tenant.has_wifi ? tenant.wifi_rate : 0) + 
                tenant.arrears + 
                (unbilledRefills ?? []).reduce((s, r) => s + (r.amount || 0), 0)
              )}
            </p>
            {tenant.credit_balance > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                Minus {formatPeso(tenant.credit_balance)} credit balance
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vault */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>Document Vault</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Upload lease agreements, IDs, or receipts for this tenant. These will be securely visible to them in their dashboard.
        </p>
        
        {vaultDocs && vaultDocs.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {vaultDocs.map(doc => {
              return (
                <li key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>📄 {doc.name.replace(/^\d+_/, '')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{((doc.metadata?.size ?? 0) / 1024).toFixed(1)} KB</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>No documents in vault.</p>
        )}

        <VaultUpload tenantId={id} />
      </div>

      {/* Bills */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Recent Bills</h2>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Period</th><th>Rent</th><th>Electric</th><th>Water</th>
                <th>WiFi</th><th>Arrears</th><th>Credit</th><th>Total Due</th><th>Paid?</th>
              </tr>
            </thead>
            <tbody>
              {(bills ?? []).map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.period_label}</td>
                  <td>{formatPeso(b.rent_amount)}</td>
                  <td>{formatPeso(b.electric_amount)}</td>
                  <td>{formatPeso(b.water_amount)}</td>
                  <td>{formatPeso(b.wifi_amount)}</td>
                  <td style={{ color: b.arrears_carried > 0 ? '#ef4444' : 'inherit' }}>{formatPeso(b.arrears_carried)}</td>
                  <td style={{ color: b.credit_applied > 0 ? '#10b981' : 'inherit' }}>-{formatPeso(b.credit_applied)}</td>
                  <td style={{ fontWeight: 700 }}>{formatPeso(b.total_due)}</td>
                  <td><span className={`badge ${b.is_paid ? 'badge-verified' : 'badge-pending'}`}>{b.is_paid ? 'Paid' : 'Unpaid'}</span></td>
                </tr>
              ))}
              {!bills?.length && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No bills generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment history */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Payment History</h2>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Date</th><th>Amount</th><th>GCash Ref</th><th>Status</th><th>Verified At</th></tr>
            </thead>
            <tbody>
              {(payments ?? []).map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(p.date_submitted)}</td>
                  <td style={{ fontWeight: 600 }}>{formatPeso(p.amount)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.gcash_ref}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.verified_at ? formatDateTime(p.verified_at) : '—'}</td>
                </tr>
              ))}
              {!payments?.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ marginTop: '3rem', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: '#ef4444' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Permanently delete this tenant and all associated data. This action is irreversible and should only be used if you want to completely wipe their history from the system.
        </p>
        <DeleteTenantButton tenantId={id} name={tenant.name} />
      </div>
    </div>
  );
}
