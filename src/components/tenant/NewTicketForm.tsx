'use client';

import { useState } from 'react';
import { createMaintenanceTicket } from '@/app/actions/maintenance';
import { Upload, Wrench } from 'lucide-react';

export function NewTicketForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const res = await createMaintenanceTicket(formData);
    if (res.error) {
      alert(res.error);
    } else {
      setSuccess(true);
      form.reset();
      setFile(null);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: '0.5rem' }}>
          <Wrench size={20} />
        </div>
        <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Report a Problem</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group">
          <label htmlFor="description">Describe the issue</label>
          <textarea 
            id="description" 
            name="description" 
            required 
            className="input" 
            placeholder="e.g. Kitchen sink is leaking, Light in bedroom won't turn on..."
            style={{ minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        <div className="input-group">
          <label>Photo (Optional)</label>
          <label htmlFor="ticket-photo" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', border: '1px dashed var(--border)',
            borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem',
            color: file ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'var(--bg-surface)', transition: 'border-color 0.2s'
          }}>
            <Upload size={18} />
            {file ? file.name : 'Click to upload a photo of the issue'}
          </label>
          <input 
            id="ticket-photo" 
            name="photo" 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.75rem' }}>
          {loading ? 'Submitting...' : success ? 'Submitted! ✅' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
