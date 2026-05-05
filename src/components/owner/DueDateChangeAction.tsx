'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { approveDueDateChangeRequest, rejectDueDateChangeRequest } from '@/app/actions/duedate';
import { useRouter } from 'next/navigation';

interface Props {
  requestId: string;
  tenantName: string;
  currentDay: number;
  requestedDay: number;
}

export function DueDateChangeAction({ requestId, tenantName, currentDay, requestedDay }: Props) {
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const router = useRouter();

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  async function handleApprove() {
    if (!confirm(
      `Approve ${tenantName}'s request to change due date from ${ordinal(currentDay)} to ${ordinal(requestedDay)}?`
    )) return;

    setLoading(true);
    try {
      const result = await approveDueDateChangeRequest(requestId, note || undefined);
      if (result.error) {
        alert(result.error);
      } else {
        alert('✅ Request approved!');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to approve request.');
    } finally {
      setLoading(false);
      setShowNote(false);
      setNote('');
    }
  }

  async function handleReject() {
    if (!confirm(`Reject ${tenantName}'s request?`)) return;

    setLoading(true);
    try {
      const result = await rejectDueDateChangeRequest(requestId, note || undefined);
      if (result.error) {
        alert(result.error);
      } else {
        alert('✅ Request rejected!');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject request.');
    } finally {
      setLoading(false);
      setShowNote(false);
      setNote('');
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {showNote && (
        <div
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            marginBottom: '0.5rem',
          }}
        >
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note for the tenant (optional)..."
            style={{
              width: '100%', padding: '0.5rem', borderRadius: '0.25rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              fontSize: '0.75rem', fontFamily: 'inherit', resize: 'vertical',
              minHeight: '60px',
            }}
          />
        </div>
      )}
      <button
        onClick={() => setShowNote(!showNote)}
        disabled={loading}
        style={{
          padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
          color: 'var(--text-muted)', cursor: loading ? 'not-allowed' : 'pointer',
          background: 'transparent', border: 'none', fontWeight: 600,
        }}
      >
        {showNote ? '✕ Cancel Note' : '+ Add Note'}
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="btn btn-primary"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        <CheckCircle size={14} /> Approve
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="btn btn-ghost"
        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        <XCircle size={14} /> Reject
      </button>
    </div>
  );
}
