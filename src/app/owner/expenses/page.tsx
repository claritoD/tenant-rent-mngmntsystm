import { createClient } from '@/lib/supabase/server';
import { formatPeso, formatDate } from '@/utils/format';
import { AddExpenseForm } from '@/components/owner/AddExpenseForm';
import { Trash2 } from 'lucide-react';
import { deleteExpense } from '@/app/actions/expenses';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Expense Tracking' };

export default async function ExpensesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Expense Tracking</h1>
        <p>Record and monitor all property-related spending.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
        <AddExpenseForm />

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Expense History</h2>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent</p>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ef4444' }}>{formatPeso(totalExpenses)}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses && expenses.length > 0 ? (
                  expenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(e.date)}</td>
                      <td style={{ fontWeight: 500 }}>{e.description}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '0.4rem', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                          {e.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#ef4444' }}>{formatPeso(e.amount)}</td>
                      <td>
                        <DeleteExpenseButton expenseId={e.id} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No expenses recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline helper for deletion
function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  return (
    <form action={async () => {
      'use server';
      await deleteExpense(expenseId);
    }}>
      <button type="submit" className="btn btn-ghost" style={{ color: '#ef4444', padding: '0.4rem' }}>
        <Trash2 size={16} />
      </button>
    </form>
  );
}
