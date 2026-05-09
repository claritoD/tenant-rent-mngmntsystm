'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      });
    }
  }, []);

  async function handleToggle() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe from push
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          // Remove from DB using client-side Supabase (session is available here)
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
          }
        }
        setIsSubscribed(false);
      } else {
        // Request browser permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied. Please enable it in your browser settings.');
          setLoading(false);
          return;
        }

        // Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        );
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Save to DB using client-side Supabase (live session, no cookie issues)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in.');

        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            { user_id: user.id, subscription: JSON.parse(JSON.stringify(subscription)) },
            { onConflict: 'user_id' }
          );

        if (error) throw new Error(error.message);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Push notification toggle failed:', err);
      alert(`Failed to toggle notifications: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="card" style={{ padding: '1.5rem', maxWidth: '480px' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: 'white' }}>
          Push Notifications
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div>
        <h2 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1rem', color: 'white' }}>
          Real-time Push Alerts
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isSubscribed
            ? 'You will receive desktop/mobile alerts for urgent events.'
            : 'Enable to get instant alerts for payments, maintenance & requests.'}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: isSubscribed ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          color: isSubscribed ? '#ef4444' : '#10b981',
          fontWeight: 600,
          fontSize: '0.875rem',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
        {loading ? 'Please wait...' : isSubscribed ? 'Disable' : 'Enable'}
      </button>
    </div>
  );
}
