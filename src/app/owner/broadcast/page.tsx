'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, History, CheckCircle2, Pin, Trash2, Edit, Save, X, Image as ImageIcon, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { broadcastMessageToTenants } from '@/app/actions/notifications';
import { deleteAnnouncement, updateAnnouncement } from '@/app/actions/announcements';
import { formatDate } from '@/utils/format';
import { compressImage } from '@/utils/image';
import type { Announcement } from '@/types/database.types';

function getExpiryLabel(expiresAt: string | null): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Expired', urgent: true };
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const urgent = totalHours < 24;
  if (days > 0) return { label: `${days}d ${hours}h left`, urgent };
  return { label: `${hours}h left`, urgent: true };
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    const [{ data: props, error: propsErr }, { data: anns, error: annsErr }] = await Promise.all([
      (supabase as any).from('properties').select('id, name').order('name'),
      (supabase as any).from('announcements').select('*').order('created_at', { ascending: false })
    ]);
    if (propsErr) console.error('Props Err:', propsErr);
    if (annsErr) console.error('Anns Err:', annsErr);
    if (props) setProperties(props);
    if (anns) setAnnouncements(anns);
  }

  async function uploadFile(file: File): Promise<string> {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('announcements')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('announcements')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const target = selectedProperty === 'all' ? 'ALL active tenants' : `tenants in ${properties.find(p => p.id === selectedProperty)?.name}`;
    if (!confirm(`Are you sure you want to send this broadcast to ${target}?`)) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        imageUrl = await uploadFile(compressed);
      }

      const res = await broadcastMessageToTenants(title, message, isPinned, selectedProperty === 'all' ? null : selectedProperty, imageUrl, expiresInDays);
      if (res?.error) throw new Error(res.error);
      
      setSuccess(true);
      setTitle('');
      setMessage('');
      setIsPinned(false);
      setExpiresInDays(7);
      setImageFile(null);
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
        <h1>Broadcast Dashboard</h1>
        <p>Manage announcements and instant notifications for all active tenants.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <p className="section-title">Total Broadcasts</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{announcements.length}</p>
        </div>
        <div className="stat-card">
          <p className="section-title">Global Notices</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{announcements.filter(a => !a.property_id).length}</p>
        </div>
        <div className="stat-card">
          <p className="section-title">Building Specific</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{announcements.filter(a => a.property_id).length}</p>
        </div>
        <div className="stat-card">
          <p className="section-title">Pinned Items</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{announcements.filter(a => a.is_pinned).length}</p>
        </div>
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
                style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'monospace' }}
                placeholder="Write your detailed message here... (Markdown supported)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Image Attachment (Optional)</label>
              <div style={{
                border: '1px dashed var(--border)', borderRadius: '0.5rem', padding: '1rem',
                textAlign: 'center', background: 'var(--bg-surface)'
              }}>
                <input type="file" accept="image/*" id="announcement-image"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }} disabled={loading} />
                <label htmlFor="announcement-image" style={{ cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={20} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {imageFile ? imageFile.name : 'Click to attach an image'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="b-expires">Auto-Delete Duration</label>
              <select 
                id="b-expires"
                className="input"
                value={expiresInDays === null ? 'null' : expiresInDays.toString()}
                onChange={e => setExpiresInDays(e.target.value === 'null' ? null : parseInt(e.target.value))}
                disabled={loading}
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days (Default)</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="null">Never Delete</option>
              </select>
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
                  <div key={ann.id} className="card-sm hover-lift" style={{ 
                    position: 'relative', 
                    borderLeft: ann.is_pinned ? '3px solid var(--warning)' : '3px solid var(--border)',
                    padding: '1.25rem',
                    background: ann.is_pinned ? 'rgba(245,158,11,0.02)' : 'var(--bg-surface)'
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
                        {ann.image_url && (
                          <div style={{ marginBottom: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ann.image_url} alt="Attachment" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(ann.created_at)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {(() => {
                              const expiry = getExpiryLabel(ann.expires_at);
                              if (!expiry) return <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Never expires</span>;
                              return (
                                <span style={{
                                  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '1rem',
                                  background: expiry.urgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                  color: expiry.urgent ? '#ef4444' : '#d97706',
                                  border: `1px solid ${expiry.urgent ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                }}>
                                  ⏱ {expiry.label}
                                </span>
                              );
                            })()}
                            <span style={{ fontSize: '0.7rem', color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontWeight: 500 }}>
                              {ann.property_id ? properties.find(p => p.id === ann.property_id)?.name : 'Global'}
                            </span>
                          </div>
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
