'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { checkRateLimit, incrementLoginAttempt, resetLoginAttempts } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const rateLimit = await checkRateLimit(email);
    if (rateLimit.locked) {
      setError(`Account locked due to too many failed attempts. Try again in ${rateLimit.remainingMinutes} minutes.`);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      await incrementLoginAttempt(email);
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    await resetLoginAttempts(email);

    const role = data.user?.user_metadata?.role;
    
    // 2. Strict Verification for Tenants
    if (role === 'tenant') {
      const { data: tenant, error: tErr } = await (supabase as any)
        .from('tenants')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

      if (tErr || !tenant) {
        await supabase.auth.signOut();
        setError('Your account no longer exists in our records.');
        setLoading(false);
        return;
      }

      if (!tenant.is_active) {
        await supabase.auth.signOut();
        setError('Your account has been archived. Please contact the landlord.');
        setLoading(false);
        return;
      }
    }

    router.push(role === 'owner' ? '/owner' : '/tenant');
  }


  return (
    <div style={{ 
      minHeight: '100dvh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative',
      background: '#0d0f1a', // Fallback
      overflow: 'hidden'
    }}>
      {/* Absolute Background Layer */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0d0f1a 0%, #131627 50%, #1a1e33 100%)',
        zIndex: 0
      }} />

      {/* Decorative Orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <main className="animate-enter" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '16px', marginBottom: '1rem',
            boxShadow: '0 0 32px rgba(99,102,241,0.4)',
          }}>
            <Home size={28} color="#fff" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>RentsEasy</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Tenant Management Portal
          </p>
        </div>

        {/* Card */}
        <div className="login-card" style={{
          background: 'rgba(26,30,51,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1rem',
        }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            Sign in to your account
          </h2>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
              color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label className="label" htmlFor="email" style={{ color: '#94a3b8' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '0.65rem 0.875rem 0.65rem 2.5rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password" style={{ color: '#94a3b8' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <Link href="/forgot-password" style={{ color: '#8b5cf6', fontSize: '0.875rem', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center', marginTop: '0.5rem',
                padding: '0.75rem',
                background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.4)',
                fontSize: '0.9rem',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
