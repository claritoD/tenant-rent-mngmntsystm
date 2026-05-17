'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { updateDashboardSettings } from '@/app/actions/dashboard';
import type { OwnerDashboardSettings } from '@/types/database.types';
import { useRouter } from 'next/navigation';

interface SettingsProps {
  initialSettings: OwnerDashboardSettings;
}

const ANALYTIC_OPTIONS = [
  { key: 'show_revenue_chart', label: 'Revenue Chart', description: 'Show monthly revenue metrics' },
  { key: 'show_payment_stats', label: 'Payment Statistics', description: 'Show payment status breakdown' },
  { key: 'show_tenant_occupancy', label: 'Tenant Occupancy', description: 'Show occupancy rate' },
  { key: 'show_outstanding_arrears', label: 'Outstanding Arrears', description: 'Show unpaid amounts' },
  { key: 'show_utility_consumption', label: 'Utility Consumption', description: 'Show electricity & water usage' },
  { key: 'show_maintenance_tickets', label: 'Maintenance Tickets', description: 'Show maintenance requests' },
  { key: 'show_expense_breakdown', label: 'Expense Breakdown', description: 'Show expense categories' },
  { key: 'show_water_refill_pending', label: 'Pending Water Refills', description: 'Show pending refill requests' },
  { key: 'show_due_date_pending', label: 'Pending Due Date Changes', description: 'Show pending date change requests' },
] as const;

export function DashboardSettingsForm({ initialSettings }: SettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      const result = await updateDashboardSettings(settings);
      if (result.error) {
        alert(result.error);
      } else {
        alert('✅ Dashboard settings saved!');
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(key: keyof OwnerDashboardSettings) {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function selectAll() {
    const newSettings = { ...settings };
    ANALYTIC_OPTIONS.forEach(opt => {
      (newSettings as any)[opt.key] = true;
    });
    setSettings(newSettings);
  }

  function deselectAll() {
    const newSettings = { ...settings };
    ANALYTIC_OPTIONS.forEach(opt => {
      (newSettings as any)[opt.key] = false;
    });
    setSettings(newSettings);
  }

  const enabledCount = ANALYTIC_OPTIONS.filter(opt => (settings as any)[opt.key]).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          background: 'var(--border)', border: 'none',
          color: 'var(--text-primary)', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem',
        }}
      >
        <Settings size={16} />
        Customize Analytics ({enabledCount}/{ANALYTIC_OPTIONS.length})
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setIsOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: '1rem',
              padding: '2rem', maxWidth: '600px', width: '90%',
              maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
              position: 'relative',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Customize Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Select which analytics you want displayed on your owner dashboard.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                onClick={selectAll}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: 'var(--brand-600)', color: '#fff', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.75rem',
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: 'transparent', color: 'var(--text-primary)', 
                  border: '1px solid var(--border)',
                  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.75rem',
                }}
              >
                Deselect All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {ANALYTIC_OPTIONS.map(({ key, label, description }) => (
                <div
                  key={key}
                  onClick={() => toggleOption(key as keyof OwnerDashboardSettings)}
                  style={{
                    padding: '1rem', borderRadius: '0.5rem',
                    background: (settings as any)[key] ? 'var(--brand-600)' : 'var(--bg-surface)',
                    border: `1px solid ${(settings as any)[key] ? 'var(--brand-600)' : 'var(--border)'}`,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <input
                      type="checkbox"
                      checked={!!(settings as any)[key]}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <p style={{
                      fontWeight: 600, fontSize: '0.875rem',
                      color: (settings as any)[key] ? '#fff' : 'var(--text-primary)',
                    }}>
                      {label}
                    </p>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: (settings as any)[key] ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                  }}>
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: '0.5rem',
                  background: 'var(--brand-600)', color: '#fff', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

