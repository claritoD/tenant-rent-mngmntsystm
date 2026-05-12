'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, History, CheckCircle2, Pin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { broadcastMessageToTenants } from '@/app/actions/notifications';

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperties() {
      const { data } = await (await createClient()).from('properties').select('id, name').order('name');
      if (data) setProperties(data);
    }
    loadProperties();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const target = selectedProperty === 'all' ? 'ALL active tenants' : `tenants in ${properties.find(p => p.id === selectedProperty)?.name}`;
    if (!confirm(`Are you sure you want to send this broadcast to ${target}?`)) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await broadcastMessageToTenants(title, message, isPinned, selectedProperty === 'all' ? null : selectedProperty);
      if (res?.error) throw new Error(res.error);
      
      setSuccess(true);
      setTitle('');
      setMessage('');
      setIsPinned(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Broadcast Messaging</h1>
        <p>Send an instant Push Notification and Email to all active tenants.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Composer */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: '50%', padding: '0.5rem' }}>
              <Megaphone size={20} />
            </div>
            <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Compose Announcement</h2>
          </div>

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Broadcast sent successfully to all tenants!</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '1rem', color: '#ef4444', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label" htmlFor="b-target">Target Audience</label>
              <select 
                id="b-target"
                className="input"
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                disabled={loading}
              >
                <option value="all">📢 All Active Tenants (Global)</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>🏢 Only {p.name}</option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                {selectedProperty === 'all' ? 'Every tenant across all buildings will receive this.' : `Only tenants assigned to ${properties.find(p => p.id === selectedProperty)?.name} will receive this.`}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="b-title">Headline / Subject</label>
              <input 
                id="b-title"
                className="input"
                placeholder="e.g. Water Maintenance Tomorrow"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label" htmlFor="b-msg">Message Content</label>
              <textarea 
                id="b-msg"
                className="input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Write your detailed message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-base)', padding: '0.75rem', borderRadius: '0.5rem', border: isPinned ? '1px solid #f59e0b' : '1px solid var(--border)', transition: 'all 0.2s' }}>
              <input 
                type="checkbox" 
                id="b-pin"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="b-pin" style={{ fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isPinned ? '#b45309' : 'var(--text-primary)' }}>
                <Pin size={14} style={{ transform: isPinned ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} /> 
                Pin to Bulletin Board (stays at the top)
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ justifyContent: 'center', padding: '0.75rem', gap: '0.5rem' }}
            >
              <Send size={18} />
              {loading ? 'Sending Broadcast...' : 'Send to All Tenants'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg-base))' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' }}>How it works</h3>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Instant Push</strong>: Every tenant with notifications enabled will receive a popup on their phone/browser.</li>
              <li><strong>Email Backup</strong>: A professional email is sent to everyone&apos;s registered address.</li>
              <li><strong>History</strong>: Announcements are saved and will appear in the tenant&apos;s "Bulletin Board" (coming soon).</li>
              <li><strong>Safety</strong>: Use this for building-wide updates only.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
