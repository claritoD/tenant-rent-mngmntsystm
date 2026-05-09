'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CreditCard, Upload, Banknote, Smartphone, Check } from 'lucide-react';


export default function PayPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [gcashRef, setGcashRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'gcash' | 'cash'>('gcash');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadQr() {
      const supabase = createClient();
      const { data } = await supabase.storage.from('settings').list();
      const qrFile = data?.find(f => f.name.startsWith('gcash-qr'));
      if (qrFile) {
        const { data: { publicUrl } } = supabase.storage.from('settings').getPublicUrl(qrFile.name);
        setQrUrl(publicUrl);
      }
    }
    loadQr();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated.'); setLoading(false); return; }

    try {
      let proofUrl: string | null = null;
      if (method === 'gcash' && proofFile) {
        const path = `${user.id}/${Date.now()}_${proofFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(path, proofFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);
        proofUrl = publicUrl;
      }

      const { error: dbError } = await supabase.from('payments').insert({
        tenant_id: user.id,
        amount: parseFloat(amount),
        payment_method: method,
        gcash_ref: method === 'gcash' ? gcashRef.trim() : null,
        proof_url: proofUrl,
        status: 'pending',
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setAmount(''); setGcashRef(''); setProofFile(null);
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Pay Rent</h1>
        <p>Select your payment method and submit details for verification.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* GCash Card */}
        <div 
          onClick={() => setMethod('gcash')}
          style={{
            cursor: 'pointer',
            padding: '1.5rem',
            borderRadius: '1rem',
            background: method === 'gcash' ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface)',
            border: `2px solid ${method === 'gcash' ? '#6366f1' : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {method === 'gcash' && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#6366f1' }}>
              <Check size={18} />
            </div>
          )}
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: method === 'gcash' ? '#6366f1' : 'var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: method === 'gcash' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>
            <Smartphone size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: method === 'gcash' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>GCash</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Digital Payment</p>
          </div>
        </div>

        {/* Cash Card */}
        <div 
          onClick={() => setMethod('cash')}
          style={{
            cursor: 'pointer',
            padding: '1.5rem',
            borderRadius: '1rem',
            background: method === 'cash' ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)',
            border: `2px solid ${method === 'cash' ? '#10b981' : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {method === 'cash' && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#10b981' }}>
              <Check size={18} />
            </div>
          )}
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: method === 'cash' ? '#10b981' : 'var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: method === 'cash' ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>
            <Banknote size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: method === 'cash' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Cash</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Face-to-Face</p>
          </div>
        </div>
      </div>


      {method === 'gcash' && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
          {qrUrl ? (
            <div style={{ position: 'relative', width: '200px', height: '200px', background: '#fff', padding: '0.5rem', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <Image 
                src={qrUrl} 
                alt="Landlord GCash QR" 
                fill
                style={{ objectFit: 'contain', padding: '0.5rem' }} 
              />
            </div>
          ) : (
            <div style={{
              width: '180px', height: '180px', background: 'var(--bg-surface)', border: '2px dashed var(--border)',
              borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', gap: '0.5rem', marginBottom: '1rem',
            }}>
              <CreditCard size={40} />
              <p style={{ fontSize: '0.8rem' }}>No QR Code Set</p>
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Scan the QR above, complete your payment, then fill in the form below.
          </p>
        </div>
      )}

      {method === 'cash' && (
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Hand your payment directly to your landlord.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fill out the form below to notify the landlord of your pending cash payment. They will verify it once received.</p>
        </div>
      )}

      <div className="card" style={{ maxWidth: '480px' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>Submit Payment</h2>

        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✅ Payment submitted! Waiting for landlord verification.
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" htmlFor="pay-amount">Amount Paid (₱)</label>
            <input id="pay-amount" type="number" step="0.01" min="1" required className="input"
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 4500" />
          </div>

          {method === 'gcash' && (
            <>
              <div>
                <label className="label" htmlFor="gcash-ref">GCash Reference Number</label>
                <input id="gcash-ref" type="text" className="input"
                  value={gcashRef} onChange={e => setGcashRef(e.target.value)}
                  placeholder="e.g. 2024050612345678" />
              </div>

              <div>
                <label className="label" htmlFor="proof-upload">Payment Screenshot (optional)</label>
                <label htmlFor="proof-upload" style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 0.875rem', border: '1px dashed var(--border)',
                  borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem',
                  color: proofFile ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                }}>
                  <Upload size={16} />
                  {proofFile ? proofFile.name : 'Click to upload screenshot'}
                </label>
                <input id="proof-upload" type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
              </div>
            </>
          )}

          <button id="submit-payment-btn" type="submit" className="btn btn-primary"
            disabled={loading} style={{ justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }}>
            {loading ? 'Submitting…' : 'Submit Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
