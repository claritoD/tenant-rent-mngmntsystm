import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate } from '@/utils/format';
import { nextAnniversaryDate } from '@/utils/billing';
import GenerateBillButton from '@/components/owner/GenerateBillButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, unit:units(*)')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Generate Bills</h1>
        <p>Review tenant utility usage and generate their monthly hybrid bill.</p>
      </div>

      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr><th>Tenant</th><th>Unit</th><th>Next Bill Due</th><th>Arrears</th><th>Credit</th><th>Action</th></tr>
            </thead>
            <tbody>
              {(tenants ?? []).map(t => {
                const unit = t.unit as { unit_name: string } | null;
                const nextBill = nextAnniversaryDate(t.move_in_date);
                const isDue = nextBill <= new Date(); // roughly
                
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{unit?.unit_name ?? '—'}</td>
                    <td style={{ color: isDue ? '#ef4444' : 'inherit', fontWeight: isDue ? 600 : 400 }}>
                      {formatDate(nextBill.toISOString())}
                    </td>
                    <td style={{ color: t.arrears > 0 ? '#ef4444' : 'inherit' }}>{formatPeso(t.arrears)}</td>
                    <td style={{ color: t.credit_balance > 0 ? '#10b981' : 'inherit' }}>{formatPeso(t.credit_balance)}</td>
                    <td>
                      <GenerateBillButton tenantId={t.id} />
                    </td>
                  </tr>
                );
              })}
              {!tenants?.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No active tenants.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
