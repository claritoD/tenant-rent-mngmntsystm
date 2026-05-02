'use client';

import { useState } from 'react';
import { deleteUnit } from '@/app/actions/units';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteUnitButton({ unitId, name }: { unitId: string, name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const res = await deleteUnit(unitId);
    if (res.error) {
      alert(res.error);
    } else {
      alert('Unit deleted successfully.');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading} 
      className="btn btn-ghost" 
      style={{ color: '#ef4444', padding: '0.5rem' }}
      title="Delete Unit"
    >
      <Trash2 size={18} />
    </button>
  );
}
