import { ChangePasswordForm } from '@/components/shared/ChangePasswordForm';

export default function TenantSettingsPage() {
  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto animate-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Account Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your personal details and security.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
