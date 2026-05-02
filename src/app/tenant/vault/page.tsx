import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Download } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Documents' };

export default async function VaultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // List files in tenant's own folder in 'vault' bucket
  const { data: vaultDocs } = await supabase.storage
    .from('vault')
    .list(user.id, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

  function getUrl(path: string) {
    const { data: { publicUrl } } = supabase.storage.from('vault').getPublicUrl(path);
    return publicUrl;
  }

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>My Documents</h1>
        <p>Access your lease agreement and move-in photos uploaded by your landlord.</p>
      </div>

      {/* Vault Docs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FileText size={18} color="#6366f1" />
          <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Uploaded Documents</h2>
        </div>
        {!vaultDocs?.length ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No documents uploaded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {vaultDocs.map(f => (
              <a key={f.id}
                href={getUrl(`${user.id}/${f.name}`)}
                target="_blank" rel="noreferrer"
                download
                className="card-sm"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  textDecoration: 'none', color: 'var(--text-primary)',
                  transition: 'border-color 0.15s',
                }}>
                <Download size={16} color="#6366f1" />
                <span style={{ fontSize: '0.875rem', flex: 1 }}>{f.name.replace(/^\d+_/, '')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {((f.metadata?.size ?? 0) / 1024).toFixed(0)} KB
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
