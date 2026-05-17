import { createClient } from '@/lib/supabase/server';
import { QuickStartWizard } from '@/components/owner/QuickStartWizard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Quick Start' };

export default async function QuickStartPage() {
  const supabase = await createClient();
  const { data: units } = await (supabase as any).from('units').select('*').order('unit_name');

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Tenant Quick Start</h1>
        <p>Use this wizard to quickly onboard your current tenants and import their recent payment history.</p>
      </div>

      <QuickStartWizard units={units ?? []} />
    </div>
  );
}

