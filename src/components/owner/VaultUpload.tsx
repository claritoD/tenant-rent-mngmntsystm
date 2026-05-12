'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/utils/image';

export function VaultUpload({ tenantId }: { tenantId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }
      
      const path = `${tenantId}/${Date.now()}_${fileToUpload.name}`;
      const { error } = await supabase.storage.from('vault').upload(path, fileToUpload);
      
      if (error) {
        alert('Upload failed: ' + error.message);
      } else {
        alert('Document uploaded successfully to the vault.');
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <label htmlFor="vault-upload" className="btn btn-primary" style={{ cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
        <Upload size={16} /> {loading ? 'Uploading...' : 'Upload Document'}
      </label>
      <input 
        id="vault-upload" 
        type="file" 
        onChange={handleUpload} 
        style={{ display: 'none' }} 
        disabled={loading} 
      />
    </div>
  );
}
