import { SettingsForm } from '@/components/owner/SettingsForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="animate-enter">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your landlord profile and application preferences.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <SettingsForm />
      </div>
    </div>
  );
}
