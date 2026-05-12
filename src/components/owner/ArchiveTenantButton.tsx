'use client';

import { useState } from 'react';
import { archiveTenant } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';
import { Archive } from 'lucide-react';

export function ArchiveTenantButton({ tenantId, name }: { tenantId: string, name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleArchive() {
    if (!confirm(`Are you sure you want to archive ${name}? They will be removed from their unit and marked as "Inactive", but their payment history and records will be preserved.`)) {
      return;
    }

    setLoading(true);
    const res = await archiveTenant(tenantId);
    if (res.error) {
      alert(res.error);
    } else {
      alert('Tenant archived successfully.');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button 
      onClick={handleArchive} 
      disabled={loading} 
      className="btn btn-ghost" 
      style={{ color: '#f59e0b', gap: '0.5rem' }}
    >
      <Archive size={18} />
      {loading ? 'Archiving...' : 'Archive Tenant'}
    </button>
  );
}
