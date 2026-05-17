'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Download } from 'lucide-react';
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

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [swError, setSwError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsIOS(isIosDevice());
      setIsStandalone(isInStandaloneMode());
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
      }
    });

    if ('serviceWorker' in navigator && 'PushManager' in window) {

      navigator.serviceWorker.register('/sw.js')
        .then(async (reg) => {
          // Force the SW to update to pick up our latest changes
          reg.update();
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
          setSwError('Service worker failed to register. Try a hard refresh (Ctrl+Shift+R).');
        });
    }
  }, []);

  async function handleToggle() {
    setLoading(true);
    setSwError(null);
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Service worker timed out. Try refreshing the page.')), 8000)
        ),
      ]);

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
          }
        }
        setIsSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
          setSwError('Permission denied. Open your browser settings and allow notifications for this site, then try again.');
          setLoading(false);
          return;
        }
        if (permission !== 'granted') {
          setLoading(false);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error('VAPID public key is not configured.');

        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in. Please refresh and try again.');

        const subJson = subscription.toJSON();
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            { 
              user_id: user.id, 
              endpoint: subJson.endpoint, 
              subscription: subJson 
            },
            { onConflict: 'endpoint' }
          );

        if (error) throw new Error(`DB error: ${error.message}`);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Push notification toggle failed:', err);
      setSwError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── iOS + not installed as PWA ──────────────────────────────────────────
  if (isIOS && !isStandalone) {
    return (
      <div
        className="card"
        style={{
          padding: '1.5rem',
          maxWidth: '480px',
          border: '1px solid rgba(99,102,241,0.35)',
          background: 'rgba(99,102,241,0.07)',
          borderRadius: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <div
            style={{
              flexShrink: 0,
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'rgba(99,102,241,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={18} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem', color: 'white' }}>
              Enable Push Notifications on iOS
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
              Safari on iPhone/iPad requires this app to be installed before push alerts can work.
            </p>
            <ol style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '1.1rem', margin: 0 }}>
              <li>Tap the <strong style={{ color: 'white' }}>Share</strong> button <span style={{ fontSize: '1rem' }}>⎙</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong style={{ color: 'white' }}>&quot;Add to Home Screen&quot;</strong></li>
              <li>Tap <strong style={{ color: 'white' }}>Add</strong> — then open the app from your home screen</li>
              <li>Come back to Settings and enable push notifications</li>
            </ol>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.9rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.4rem',
                background: 'rgba(99,102,241,0.2)',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Download size={13} />
              Install app to continue
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Browser doesn't support push ────────────────────────────────────────
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

  // ── Main toggle ─────────────────────────────────────────────────────────
  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
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
          id="push-notification-toggle"
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
          {loading ? 'Please wait…' : isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>

      {swError && (
        <p
          style={{
            fontSize: '0.8rem',
            color: '#fca5a5',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '0.4rem',
            padding: '0.5rem 0.75rem',
            margin: 0,
          }}
        >
          ⚠ {swError}
        </p>
      )}
    </div>
  );
}
