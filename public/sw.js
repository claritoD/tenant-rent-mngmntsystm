// RentsEasy Service Worker

// Force new SW to activate immediately — no waiting for old tabs to close
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  let title = 'RentsEasy';
  let options = {
    body: 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: 'https://rentseasy.vercel.app/owner' },
    requireInteraction: false,
  };

  try {
    if (event.data) {
      const data = event.data.json();
      title = data.title || title;
      options = {
        body: data.body || options.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || 'https://rentseasy.vercel.app/owner' },
        requireInteraction: false,
      };
    }
  } catch (e) {
    // If JSON parse fails try to use raw text as the body
    if (event.data) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : 'https://rentseasy.vercel.app/owner';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus an already-open tab if possible
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
