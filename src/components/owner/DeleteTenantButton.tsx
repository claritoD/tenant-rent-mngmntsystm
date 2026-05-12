'use client';

import { useState } from 'react';
import { deleteTenant } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteTenantButton({ tenantId, name }: { tenantId: string, name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${name}? This will wipe out all their bills, payments, and history. This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const res = await deleteTenant(tenantId);
    if (res.error) {
      alert(res.error);
    } else {
      alert('Tenant and all data deleted successfully.');
      router.push('/owner/tenants');
    }
    setLoading(false);
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading} 
      className="btn btn-ghost" 
      style={{ color: '#ef4444', gap: '0.5rem' }}
    >
      <Trash2 size={18} />
      {loading ? 'Deleting...' : 'Delete Tenant'}
    </button>
  );
}
