'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated successfully.');
      setPassword('');
    }
    setLoading(false);
  }

  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: '480px' }}>
      <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem', color: 'white' }}>Change Password</h2>
      
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem' }}>{success}</div>}

      <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="label" htmlFor="password">New Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              id="password" 
              type={showPw ? 'text' : 'password'} 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem', outline: 'none' }} 
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1.5rem' }}>
          {loading ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
