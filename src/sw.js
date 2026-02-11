import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// ─── App State Tracking (from client postMessage) ────────────────────────────
let appState = {
  isFocused: false,
  currentPath: '',
  activeChatId: null,
};

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'APP_STATE') {
    appState = {
      isFocused: event.data.isFocused ?? appState.isFocused,
      currentPath: event.data.currentPath ?? appState.currentPath,
      activeChatId: event.data.activeChatId ?? appState.activeChatId,
    };
  }
});

// ─── Push Event Handler ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'EduSpace', body: event.data?.text() || 'New update available' };
  }

  event.waitUntil(handlePushEvent(data));
});

async function handlePushEvent(data) {
  // ── Smart Suppression Logic ───────────────────────────────────────────────
  // Always allow test notifications through
  const isTest = data.type === 'test';

  if (!isTest) {
    // Check if any window client is focused
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const hasFocusedClient = clients.some((c) => c.focused);

    if (hasFocusedClient || appState.isFocused) {
      // App is in foreground — check if we should suppress completely
      const isMessageType = data.type === 'message';
      const isOnMessagesPage = appState.currentPath?.startsWith('/messages');

      // If user is on the messages page and this is a message notification for the active chat, suppress
      if (isMessageType && isOnMessagesPage) {
        const notifChatId = data.data?.conversationId || data.url?.split('conversation=')[1];
        if (appState.activeChatId && notifChatId === appState.activeChatId) {
          // User is actively viewing this exact conversation — full suppress
          return;
        }
      }

      // App is focused — let in-app toast handle it, suppress system notification
      return;
    }
  }

  // ── Build Rich Notification Options ───────────────────────────────────────
  const title = data.title || 'EduSpace';

  const options = {
    body: data.body || 'New update available',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || getDefaultTag(data),
    renotify: true, // Re-alert even if tag matches (vibrate + sound again)
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/',
      type: data.type,
      ...data.data,
    },
  };

  // Vibration pattern (mobile)
  if (data.vibrate) {
    options.vibrate = data.vibrate;
  } else {
    options.vibrate = getDefaultVibration(data.type);
  }

  // Image preview (optional for media-rich notifications)
  if (data.image) {
    options.image = data.image;
  }

  // Action buttons
  if (data.actions && Array.isArray(data.actions)) {
    options.actions = data.actions;
  } else {
    options.actions = getDefaultActions(data.type);
  }

  // Require interaction for important alerts
  if (data.requireInteraction) {
    options.requireInteraction = true;
  }

  // Silent mode
  if (data.silent) {
    options.silent = true;
    delete options.vibrate;
  }

  return self.registration.showNotification(title, options);
}

// ─── Default Tag Generation (for grouping) ──────────────────────────────────
function getDefaultTag(data) {
  const type = data.type || 'general';
  const relatedId = data.data?.conversationId || data.data?.classId || data.data?.relatedId || '';
  if (type === 'message' && relatedId) return `msg-${relatedId}`;
  if (type === 'assignment') return `assign-${relatedId || 'general'}`;
  if (type === 'announcement') return `quiz-${relatedId || 'general'}`;
  if (type === 'schedule') return `schedule-${relatedId || 'general'}`;
  if (type === 'submission') return `submission-${relatedId || 'general'}`;
  if (type === 'grade') return `grade-${relatedId || 'general'}`;
  if (type === 'test') return 'test-notification';
  return `eduspace-${type}`;
}

// ─── Default Vibration Patterns ─────────────────────────────────────────────
function getDefaultVibration(type) {
  switch (type) {
    case 'message':
      return [100, 50, 100]; // Quick double-tap
    case 'assignment':
    case 'submission':
      return [200, 100, 200]; // Firm double-tap
    case 'announcement':
    case 'schedule':
      return [200, 100, 200, 100, 200]; // Triple-tap for important
    default:
      return [100, 50, 100];
  }
}

// ─── Default Action Buttons ─────────────────────────────────────────────────
function getDefaultActions(type) {
  switch (type) {
    case 'message':
      return [
        { action: 'view', title: '💬 View Chat' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'assignment':
      return [
        { action: 'view', title: '📝 View Assignment' },
      ];
    case 'announcement':
      return [
        { action: 'view', title: '📋 View Quiz' },
      ];
    case 'submission':
      return [
        { action: 'view', title: '📄 View Submission' },
      ];
    case 'schedule':
      return [
        { action: 'view', title: '📅 View Schedule' },
      ];
    case 'grade':
      return [
        { action: 'view', title: '📊 View Grade' },
      ];
    default:
      return [
        { action: 'open', title: 'Open EduSpace' },
      ];
  }
}

// ─── Notification Click Handler ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = notificationData.url || '/';

  // Handle specific action button clicks
  if (event.action === 'dismiss') {
    return; // Just close the notification
  }
  // 'view', 'open', or default tap — navigate to the url
  if (event.action === 'view' || event.action === 'open' || !event.action) {
    event.waitUntil(openOrFocusWindow(urlToOpen));
  }
});

// ─── Notification Close Handler ─────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  // Analytics or cleanup can go here in the future
});

// ─── Helper: Open or focus existing window ──────────────────────────────────
async function openOrFocusWindow(urlToOpen) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  // Try to find an existing window with our origin to focus & navigate
  for (const client of clientList) {
    try {
      const clientUrl = new URL(client.url);
      const targetUrl = new URL(urlToOpen, self.location.origin);

      if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
        const focused = await client.focus();
        if (focused && focused.navigate) {
          return focused.navigate(urlToOpen);
        }
        return focused;
      }
    } catch {
      // URL parsing failed, skip this client
    }
  }

  // No existing window — open a new one
  if (self.clients.openWindow) {
    return self.clients.openWindow(urlToOpen);
  }
}
