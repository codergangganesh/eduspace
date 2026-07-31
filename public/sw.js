// EduSpace Background Contest Reminder Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Store scheduled timers
const scheduledTimers = new Map();

// Listen for messages from client thread
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SHOW_TEST_NOTIFICATION') {
    const iconUrl = self.location.origin + '/favicon.png';
    self.registration.showNotification('EduSpace Contest Alert', {
      body: 'Notifications are working! You will receive alerts 1 hour before contests start.',
      icon: iconUrl,
      badge: iconUrl,
      tag: 'eduspace-test-notification',
      requireInteraction: true,
      data: { url: self.location.origin + '/contests' },
    });
  } else if (data.type === 'SCHEDULE_CONTEST_REMINDER') {
    const { contestId, contestName, platform, startTimeIso, contestUrl } = data;
    const targetTime = new Date(startTimeIso).getTime() - 60 * 60 * 1000; // 1 hour before
    const now = Date.now();
    const delay = Math.max(0, targetTime - now);

    // Cancel any existing timer for this contest
    if (scheduledTimers.has(contestId)) {
      clearTimeout(scheduledTimers.get(contestId));
    }

    // Schedule notification
    const timerId = setTimeout(() => {
      self.registration.showNotification(`⚡ Contest Alert: ${contestName}`, {
        body: `${contestName} on ${platform} starts in 1 hour! Click to join.`,
        icon: '/pwa-192x192.png',
        badge: '/favicon.png',
        tag: `contest-${contestId}`,
        requireInteraction: true,
        data: { url: contestUrl },
        actions: [
          { action: 'open', title: '🚀 Open Contest' },
          { action: 'close', title: 'Dismiss' }
        ]
      });
      scheduledTimers.delete(contestId);
    }, delay);

    scheduledTimers.set(contestId, timerId);
  } else if (data.type === 'CANCEL_CONTEST_REMINDER') {
    const { contestId } = data;
    if (scheduledTimers.has(contestId)) {
      clearTimeout(scheduledTimers.get(contestId));
      scheduledTimers.delete(contestId);
    }
  }
});

// Listen for Push events from Web Push Server
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'EduSpace Contest Alert', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '⚡ Upcoming Contest Alert!';
  const options = {
    body: data.body || 'Your scheduled contest is starting soon.',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/favicon.png',
    data: { url: data.url || '/contests' },
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/contests';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
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
