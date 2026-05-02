import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDateTime } from '@/utils/format';
import { PaymentActionButtons } from '@/components/owner/PaymentActionButtons';
import { RecordPaymentForm } from '@/components/owner/RecordPaymentForm';
import { Banknote, Smartphone, Check } from 'lucide-react';


import type { Metadata } from 'next';


export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('payments')
    .select('*, tenant:tenants(name)')
    .eq('status', 'pending')
    .order('date_submitted', { ascending: true });

  const { data: activeTenants } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const { data: recent } = await supabase
    .from('payments')
    .select('*, tenant:tenants(name)')
    .neq('status', 'pending')
    .order('verified_at', { ascending: false })
    .limit(30);

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Payment Verification</h1>
        <p>Review and verify GCash payments submitted by tenants.</p>
      </div>

      <RecordPaymentForm tenants={activeTenants ?? []} />


      {/* Pending */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '0.5rem' }}>
              <Smartphone size={20} />
            </div>
            <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Pending Verification</h2>
          </div>
          {!!pending?.length && (
            <span className="badge badge-pending" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>{pending.length} Urgent</span>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date Submitted</th>
                <th>Tenant</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Reference / Details</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(pending ?? []).map(p => {
                const tenant = p.tenant as { name: string } | null;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{formatDateTime(p.date_submitted).split(',')[0]}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(p.date_submitted).split(',')[1]}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tenant?.name ?? 'Unknown'}</td>
                    <td>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600,
                        background: p.payment_method === 'cash' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                        color: p.payment_method === 'cash' ? '#10b981' : '#3b82f6',
                        border: `1px solid ${p.payment_method === 'cash' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`
                      }}>
                        {p.payment_method === 'cash' ? <Banknote size={14} /> : <Smartphone size={14} />}
                        {p.payment_method === 'cash' ? 'Cash' : 'GCash'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{formatPeso(p.amount)}</td>
                    <td>
                      {p.payment_method === 'gcash' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.gcash_ref}</span>
                          {p.proof_url && (
                            <a href={supabase.storage.from('payment-proofs').getPublicUrl(p.proof_url).data.publicUrl} 
                               target="_blank" rel="noreferrer" 
                               style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                              View Receipt
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Direct Handover</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <PaymentActionButtons paymentId={p.id} />
                    </td>
                  </tr>
                );
              })}
              {!pending?.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    <Check size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
                    <p>No pending payments. You&apos;re all caught up!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Recent History</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Processed At</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map(p => {
                const tenant = p.tenant as { name: string } | null;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{tenant?.name ?? '—'}</td>
                    <td>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.7rem', color: 'var(--text-secondary)'
                      }}>
                        {p.payment_method === 'cash' ? <Banknote size={14} /> : <Smartphone size={14} />}
                        {p.payment_method === 'cash' ? 'Cash' : 'GCash'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPeso(p.amount)}</td>
                    <td>
                      <span className={`badge badge-${p.status}`} style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {p.verified_at ? formatDateTime(p.verified_at) : '—'}
                    </td>
                  </tr>
                );
              })}
              {!recent?.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No recent history.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
