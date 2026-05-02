'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, CheckCircle } from 'lucide-react';

export function SettingsForm() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadQr() {
      const { data } = await supabase.storage.from('settings').list();
      const qrFile = data?.find(f => f.name.startsWith('gcash-qr'));
      if (qrFile) {
        const { data: { publicUrl } } = supabase.storage.from('settings').getPublicUrl(qrFile.name);
        setQrUrl(publicUrl + '?t=' + Date.now()); // cache bust
      }
    }
    loadQr();
  }, [supabase]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Delete old QR code if exists to avoid clutter
      const { data: oldFiles } = await supabase.storage.from('settings').list();
      const oldQr = oldFiles?.filter(f => f.name.startsWith('gcash-qr'));
      if (oldQr && oldQr.length > 0) {
        await supabase.storage.from('settings').remove(oldQr.map(f => f.name));
      }

      // Upload new
      const ext = file.name.split('.').pop();
      const fileName = `gcash-qr-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('settings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('settings').getPublicUrl(fileName);
      setQrUrl(publicUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to upload QR code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>GCash QR Code</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Upload your GCash QR code here. Tenants will see this on their payment page.
      </p>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
      {success && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> QR code updated!</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="GCash QR" style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.5rem', background: '#fff' }} />
        ) : (
          <div style={{ width: '200px', height: '200px', border: '2px dashed var(--border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No QR uploaded
          </div>
        )}

        <label htmlFor="qr-upload" className="btn btn-primary" style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <Upload size={16} /> {loading ? 'Uploading...' : 'Upload New QR'}
        </label>
        <input id="qr-upload" type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={loading} />
      </div>
    </div>
  );
}
