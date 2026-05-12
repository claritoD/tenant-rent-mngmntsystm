import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate, ordinal } from '@/utils/format';
import Link from 'next/link';
import { AddTenantToggle } from '@/components/owner/AddTenantToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tenants' };

export default async function TenantsPage() {
  const supabase = await createClient();

  const [{ data: tenants }, { data: units }] = await Promise.all([
    supabase.from('tenants').select('*, unit:units(*, property:properties(*))').order('name'),
    supabase.from('units').select('id, unit_name, base_rent').order('unit_name'),
  ]);

  return (
    <div className="animate-enter">
      {/* Header row with Add Tenant button */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1>Tenants</h1>
          <p>Manage all tenants and their unit assignments.</p>
        </div>
        <AddTenantToggle units={units ?? []} />
      </div>

      {/* Add Tenant form (toggled by the button above via client component) */}

      {/* Tenants table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Unit</th>
              <th>Anniversary</th>
              <th>Rent</th>
              <th>Water</th>
              <th>Arrears</th>
              <th>Credit</th>
              <th>Status</th>
              <th>Moved In</th>
            </tr>
          </thead>
          <tbody>
            {(tenants ?? []).map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/owner/tenants/${t.id}`}
                    style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                    {t.name}
                  </Link>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-600)' }}>
                      {(t.unit as any)?.property?.name ?? 'No Building'}
                    </span>
                    <span>{(t.unit as { unit_name: string } | null)?.unit_name ?? '—'}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{ordinal(t.anniversary_day)} of month</td>
                <td>{formatPeso((t.unit as { base_rent: number } | null)?.base_rent ?? 0)}</td>
                <td>
                  <span className={`badge ${t.water_mode === 'metered' ? 'badge-active' : 'badge-pending'}`}>
                    {t.water_mode === 'metered' ? 'Metered' : 'Tank'}
                  </span>
                </td>
                <td style={{ color: t.arrears > 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: t.arrears > 0 ? 600 : 400 }}>
                  {formatPeso(t.arrears)}
                </td>
                <td style={{ color: t.credit_balance > 0 ? '#10b981' : 'var(--text-secondary)', fontWeight: t.credit_balance > 0 ? 600 : 400 }}>
                  {formatPeso(t.credit_balance)}
                </td>
                <td>
                  <span className={`badge ${t.is_active ? 'badge-verified' : 'badge-rejected'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(t.move_in_date)}</td>
              </tr>
            ))}
            {!tenants?.length && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  No tenants yet. Click <strong>Add Tenant</strong> above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
