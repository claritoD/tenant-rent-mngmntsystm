'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, History, CheckCircle2, Pin, Trash2, Edit, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { broadcastMessageToTenants } from '@/app/actions/notifications';
import { deleteAnnouncement, updateAnnouncement } from '@/app/actions/announcements';
import { formatDate } from '@/utils/format';
import type { Announcement } from '@/types/database.types';

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [editProp, setEditProp] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = await createClient();
    const [{ data: props }, { data: anns }] = await Promise.all([
      supabase.from('properties').select('id, name').order('name'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false })
    ]);
    if (props) setProperties(props);
    if (anns) setAnnouncements(anns);
  }

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
      loadData(); // Refresh history
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement? It will disappear from all tenant dashboards.')) return;
    const res = await deleteAnnouncement(id);
    if (res.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } else {
      alert(res.error);
    }
  }

  function startEdit(ann: Announcement) {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditPinned(ann.is_pinned);
    setEditProp(ann.property_id);
  }

  async function handleUpdate() {
    if (!editingId) return;
    setLoading(true);
    const res = await updateAnnouncement(editingId, {
      title: editTitle,
      content: editContent,
      is_pinned: editPinned,
      property_id: editProp
    });
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      loadData();
    } else {
      alert(res.error);
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

        {/* Info & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg-base))' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' }}>How it works</h3>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Instant Push</strong>: Every tenant with notifications enabled will receive a popup on their phone/browser.</li>
              <li><strong>Email Backup</strong>: A professional email is sent to everyone&apos;s registered address.</li>
              <li><strong>Bulletin Board</strong>: Announcements appear in the tenant&apos;s dashboard.</li>
              <li><strong>Targeting</strong>: You can target specific buildings or send global alerts.</li>
            </ul>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '50%', padding: '0.5rem' }}>
                <History size={20} />
              </div>
              <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Announcement History</h2>
            </div>

            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No past announcements found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="card-sm" style={{ 
                    position: 'relative', 
                    borderLeft: ann.is_pinned ? '3px solid #f59e0b' : '3px solid var(--border)',
                    padding: '1rem'
                  }}>
                    {editingId === ann.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input 
                          className="input text-sm" 
                          value={editTitle} 
                          onChange={e => setEditTitle(e.target.value)} 
                          placeholder="Title"
                        />
                        <textarea 
                          className="input text-sm" 
                          style={{ minHeight: '80px' }}
                          value={editContent} 
                          onChange={e => setEditContent(e.target.value)}
                          placeholder="Content"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="checkbox" id={`edit-pin-${ann.id}`} checked={editPinned} onChange={e => setEditPinned(e.target.checked)} />
                          <label htmlFor={`edit-pin-${ann.id}`} className="text-xs">Pin to board</label>
                        </div>
                        <select className="input text-xs" value={editProp || 'all'} onChange={e => setEditProp(e.target.value === 'all' ? null : e.target.value)}>
                          <option value="all">Global</option>
                          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={handleUpdate} disabled={loading} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.75rem' }}>
                            <Save size={14} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.75rem' }}>
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {ann.is_pinned && <Pin size={12} style={{ color: '#f59e0b', transform: 'rotate(45deg)' }} />}
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ann.title}</h4>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => startEdit(ann)} className="btn-icon" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} title="Edit">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(ann.id)} className="btn-icon" style={{ padding: '0.25rem', color: 'var(--danger)' }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>{ann.content}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(ann.created_at)}</span>
                          <span style={{ fontSize: '0.7rem', color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontWeight: 500 }}>
                            {ann.property_id ? properties.find(p => p.id === ann.property_id)?.name : 'Global'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
