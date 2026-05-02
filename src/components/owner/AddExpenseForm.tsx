'use client';

import { useState } from 'react';
import { addExpense } from '@/app/actions/expenses';
import { Receipt } from 'lucide-react';

export function AddExpenseForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addExpense(formData);
    if (res.error) {
      alert(res.error);
    } else {
      form.reset();
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
          <Receipt size={20} />
        </div>
        <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Record Expense</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group">
          <label htmlFor="description">Description</label>
          <input id="description" name="description" required className="input" placeholder="e.g. Roof repair, Property tax, Common area bulbs" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" required className="input">
              <option value="Repair">Repair</option>
              <option value="Tax">Property Tax</option>
              <option value="Utility">Utility (Common Area)</option>
              <option value="Supplies">Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="amount">Amount (₱)</label>
            <input id="amount" name="amount" type="number" step="0.01" required className="input" placeholder="0.00" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.75rem' }}>
          {loading ? 'Recording...' : 'Record Expense'}
        </button>
      </form>
    </div>
  );
}
