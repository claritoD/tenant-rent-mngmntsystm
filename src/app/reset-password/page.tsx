'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Supabase will parse the URL hash and store the session token in local storage automatically.
    // We just wait a short moment for this to happen.
    const checkSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsReady(true);
      } else {
        // If there's no hash, maybe wait a bit to see if it's still parsing
        setTimeout(async () => {
          const { data: retry } = await supabase.auth.getSession();
          if (retry.session) setIsReady(true);
          else setError("Invalid or expired reset link. Please request a new one.");
        }, 500);
      }
    };
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#0d0f1a' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0d0f1a 0%, #131627 50%, #1a1e33 100%)', zIndex: 0 }} />

      <main className="animate-enter" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div className="login-card" style={{ background: 'rgba(26,30,51,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem' }}>
          
          <h2 style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Set new password</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Choose a strong password for your account.</p>
          
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
          
          {!isReady && !error && !success && (
             <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Verifying link...</div>
          )}

          {success ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '1rem', color: '#6ee7b7', textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem' }}>Your password has been successfully reset!</p>
              <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Continue to Login</button>
            </div>
          ) : isReady && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="password" style={{ color: '#94a3b8' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                  <input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem', background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '0.9rem' }}>
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
