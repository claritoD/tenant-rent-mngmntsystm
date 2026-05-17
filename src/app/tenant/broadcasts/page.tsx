import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/utils/format';
import { Pin, Megaphone, Info } from 'lucide-react';
import { markAnnouncementsAsRead } from '@/app/actions/tenant';
import type { Announcement } from '@/types/database.types';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const metadata: Metadata = { title: 'Bulletin Board' };

export default async function BulletinBoardPage() {
  // Mark as read immediately on load
  await markAnnouncementsAsRead();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tenant } = await (supabase as any).from('tenants').select('*, unit:units(property_id, property:properties(name))').eq('id', user.id).single();
  if (!tenant) return <p>Tenant record not found.</p>;

  const { data: announcements } = await (supabase as any).from('announcements')
    .select('*')
    .or(`property_id.is.null${tenant.unit?.property_id ? `,property_id.eq.${tenant.unit.property_id}` : ''}`)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const globalAnnouncements = (announcements ?? []).filter(a => !a.property_id);
  const buildingAnnouncements = (announcements ?? []).filter(a => a.property_id);

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Bulletin Board</h1>
        <p>Stay updated with the latest news and building announcements.</p>
      </div>

      {announcements?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ background: 'var(--bg-base)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Megaphone size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h2 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No announcements yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>When your landlord sends out a broadcast or pins a notice, it will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Building Updates */}
          {buildingAnnouncements.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#0284c7', color: '#fff', padding: '0.4rem', borderRadius: '0.5rem' }}>
                  <Info size={18} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Building Updates ({tenant.unit?.property?.name})</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {buildingAnnouncements.map(ann => (
                  <AnnouncementCard key={ann.id} ann={ann} type="building" />
                ))}
              </div>
            </section>
          )}

          {/* Universal Board */}
          {globalAnnouncements.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#6366f1', color: '#fff', padding: '0.4rem', borderRadius: '0.5rem' }}>
                  <Megaphone size={18} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Universal Board</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {globalAnnouncements.map(ann => (
                  <AnnouncementCard key={ann.id} ann={ann} type="global" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function getExpiryLabel(expiresAt: string | null): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const urgent = totalHours < 24;
  if (days > 0) return { label: `Expires in ${days}d ${hours}h`, urgent };
  return { label: `Expires in ${hours}h`, urgent: true };
}

function AnnouncementCard({ ann, type }: { ann: Announcement, type: 'global' | 'building' }) {
  const isGlobal = type === 'global';
  const accentColor = isGlobal ? 'var(--brand-500)' : 'var(--info)';
  const bgGradient = ann.is_pinned 
    ? 'linear-gradient(to right, rgba(245,158,11,0.05), transparent)' 
    : isGlobal 
      ? 'linear-gradient(to right, rgba(99,102,241,0.03), transparent)'
      : 'linear-gradient(to right, rgba(59,130,246,0.03), transparent)';

  return (
    <div className="card" style={{ 
      padding: '1.5rem', 
      borderLeft: `4px solid ${ann.is_pinned ? 'var(--warning)' : accentColor}`,
      background: bgGradient,
      position: 'relative',
    }}>
      {ann.is_pinned && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
          <Pin size={12} style={{ transform: 'rotate(45deg)' }} />
          Pinned
        </div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{ann.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{formatDate(ann.created_at)}</span>
          {(() => {
            const expiry = getExpiryLabel(ann.expires_at);
            if (!expiry) return null;
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
        </div>
      </div>
      <div className="markdown-body" style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '75ch' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {ann.content}
        </ReactMarkdown>
      </div>
      {ann.image_url && (
        <div style={{ marginTop: '1rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ann.image_url} alt="Attachment" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}

