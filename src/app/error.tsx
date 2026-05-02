'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '50%' }}>
        <AlertCircle size={48} />
      </div>
      <div>
        <h1 className="font-bold text-lg">Something went wrong!</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>An unexpected error occurred in the system.</p>
      </div>
      <button 
        onClick={() => reset()}
        className="btn btn-primary"
        style={{ padding: '0.75rem 1.5rem' }}
      >
        <RefreshCcw size={18} />
        Try Again
      </button>
    </div>
  );
}
