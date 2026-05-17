'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { sendTenantPasswordReset } from '@/app/actions/auth';

export function ResetPasswordButton({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleReset() {
    if (!confirm(`Send a password reset email to ${tenantName}? They will receive a secure link to set a new password.`)) return;
    setLoading(true);
    setStatus('idle');
    const res = await sendTenantPasswordReset(tenantId);
    setLoading(false);
    if (res?.error) {
      setStatus('error');
      setErrorMsg(res.error);
    } else {
      setStatus('sent');
      // Auto-clear after 5s
      setTimeout(() => setStatus('idle'), 5000);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        onClick={handleReset}
        disabled={loading || status === 'sent'}
        className="btn btn-ghost"
        style={{ gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem',
          color: status === 'sent' ? '#10b981' : undefined,
          borderColor: status === 'sent' ? '#10b981' : undefined,
        }}
        title="Send password reset email to tenant"
      >
        <KeyRound size={15} />
        {loading ? 'Sending…' : status === 'sent' ? 'Reset Sent ✓' : 'Reset Password'}
      </button>
      {status === 'error' && (
        <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errorMsg}</span>
      )}
    </div>
  );
}
