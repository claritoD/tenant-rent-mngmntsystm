'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { sendPasswordResetEmail } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await sendPasswordResetEmail(email);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ 
      minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      position: 'relative', background: '#0d0f1a', overflow: 'hidden'
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0d0f1a 0%, #131627 50%, #1a1e33 100%)', zIndex: 0 }} />

      <main className="animate-enter" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div className="login-card" style={{ background: 'rgba(26,30,51,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
          
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to login
          </Link>

          <h2 style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Forgot password?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter your email address and we&apos;ll send you a link to reset your password.</p>
          
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
          
          {success ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '1rem', color: '#6ee7b7', textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem' }}>Check your email for the reset link! It might take a few minutes to arrive.</p>
              <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Return to Login</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="email" style={{ color: '#94a3b8' }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                  <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '0.65rem 0.875rem 0.65rem 2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem', background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '0.9rem' }}>
                {loading ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
