'use client';

import { useState } from 'react';
import { Home, ChevronUp } from 'lucide-react';
import { AddUnitForm } from '@/components/owner/AddUnitForm';

export function AddUnitToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1.1rem',
          borderRadius: '0.5rem', cursor: 'pointer',
          background: open ? 'transparent' : 'linear-gradient(135deg, #8b5cf6, #d946ef)',
          color: open ? 'var(--text-secondary)' : '#fff',
          border: open ? '1px solid var(--border)' : '1px solid transparent',
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: open ? 'none' : '0 4px 12px rgba(139,92,246,0.35)',
          transition: 'all 0.2s',
        } as React.CSSProperties}
      >
        {open ? <ChevronUp size={16} /> : <Home size={16} />}
        {open ? 'Cancel' : 'Add Unit'}
      </button>

      {open && (
        <div style={{ marginTop: '1.25rem' }}>
          <AddUnitForm onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
