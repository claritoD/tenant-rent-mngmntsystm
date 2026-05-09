'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { savePushSubscription } from '@/app/actions/notifications';

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleToggle() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          // Note: Ideally, you'd also delete it from the DB here
        }
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });

          const res = await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
          if (res.error) throw new Error(res.error);
          setIsSubscribed(true);
        } else {
          alert('Notification permission denied.');
        }
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
      alert('Failed to toggle push notifications. See console for details.');
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="card" style={{ padding: '1.5rem', maxWidth: '480px' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: 'white' }}>Push Notifications</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h2 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1rem', color: 'white' }}>Real-time Push Alerts</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive desktop/mobile alerts for urgent events.</p>
      </div>
      
      <button 
        onClick={handleToggle}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '0.5rem',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          background: isSubscribed ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          color: isSubscribed ? '#ef4444' : '#10b981',
          fontWeight: 600, fontSize: '0.875rem'
        }}
      >
        {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
        {loading ? 'Wait...' : isSubscribed ? 'Disable' : 'Enable'}
      </button>
    </div>
  );
}
