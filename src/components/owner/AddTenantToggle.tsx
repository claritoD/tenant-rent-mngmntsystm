'use client';

import { useState } from 'react';
import { UserPlus, ChevronUp } from 'lucide-react';
import { AddTenantForm } from '@/components/owner/AddTenantForm';
import type { Unit } from '@/types/database.types';

interface Props {
  units: Pick<Unit, 'id' | 'unit_name' | 'base_rent'>[];
}

export function AddTenantToggle({ units }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        id="toggle-add-tenant-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1.1rem',
          borderRadius: '0.5rem', cursor: 'pointer',
          background: open ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: open ? 'var(--text-secondary)' : '#fff',
          border: open ? '1px solid var(--border)' : '1px solid transparent',
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: open ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
          transition: 'all 0.2s',
        } as React.CSSProperties}
      >
        {open ? <ChevronUp size={16} /> : <UserPlus size={16} />}
        {open ? 'Cancel' : 'Add Tenant'}
      </button>

      {open && (
        <div style={{ marginTop: '1.25rem' }}>
          <AddTenantForm units={units} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
