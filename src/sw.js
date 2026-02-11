import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { body: event.data.text() };
  }

  const title = data.title || 'EduSpace';
  const options = {
    body: data.body || 'New update available',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: data,
    tag: data.tag || undefined // Use tag to replace existing notifications if needed
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if any window is currently focused
      const isFocused = clientList.some((client) => client.focused);

      // Show push notification if app is backgrounded OR if it's a test notification
      if (isFocused && data.type !== 'test') {
        console.log('EduSpace is active and focused. Suppressing push notification.');
        return;
      }

      const notificationOptions = {
        ...options,
        vibrate: [100, 50, 100],
        actions: [
          {
            action: 'open',
            title: 'Open Eduspace',
          }
        ],
        primaryKey: 1
      };

      return self.registration.showNotification(title, notificationOptions);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find an existing window to focus
      for (const client of clientList) {
        // You might want to strip Query params for matching, or just check origin
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          return client.focus().then(c => {
             // Navigate to the correct page if not already there
             if (c && c.navigate) {
                return c.navigate(urlToOpen);
             }
             // Fallback if navigate isn't available on client object immediately in some browsers
             // but usually focusing is enough if we handle routing on the client side
             return client;
          });
        }
      }
      // 2. If no window found, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
