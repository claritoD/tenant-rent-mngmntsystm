'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { submitDueDateChangeRequest } from '@/app/actions/duedate';
import { useRouter } from 'next/navigation';

interface Props {
  currentAnniversaryDay: number;
}

export function DueDateChangeRequest({ currentAnniversaryDay }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedDay) {
      alert('Please select a due date.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitDueDateChangeRequest(selectedDay, reason);
      
      if (result.error) {
        alert(result.error);
      } else {
        alert('✅ Your request has been submitted! Your landlord will review it shortly.');
        setIsOpen(false);
        setSelectedDay(null);
        setReason('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
        }}
      >
        <Calendar size={18} />
        Request Due Date Change
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }} onClick={() => setIsOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)', borderRadius: '1rem',
              padding: '2rem', maxWidth: '500px', width: '90%',
              boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Request Due Date Change</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Current due date: <strong>{ordinal(currentAnniversaryDay)} of each month</strong>
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  New Due Date (Day of Month)
                </label>
                <select
                  value={selectedDay || ''}
                  onChange={e => setSelectedDay(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', fontWeight: 500,
                  }}
                >
                  <option value="">Select a day...</option>
                  {days.map(day => (
                    <option
                      key={day}
                      value={day}
                      disabled={day === currentAnniversaryDay}
                      style={{ opacity: day === currentAnniversaryDay ? 0.5 : 1 }}
                    >
                      {ordinal(day)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why do you want to change your due date?"
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical',
                    minHeight: '100px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  style={{
                    padding: '0.65rem 1.5rem', borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedDay}
                  style={{
                    padding: '0.65rem 1.5rem', borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.875rem',
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
