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
  const isTest = data.type === 'test';

  if (!isTest) {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const hasFocusedClient = clients.some((c) => c.focused);

    // CRITICAL UX RULE: Do NOT send push if user is actively using the app
    // EXCEPTION: Always show call notifications to ensure the user doesn't miss them
    if (data.type !== 'call' && (hasFocusedClient || appState.isFocused)) {
      const isMessageType = data.type === 'message';
      const isOnMessagesPage = appState.currentPath?.startsWith('/messages');

      // If user is viewing the same conversation, suppress entirely
      if (isMessageType && isOnMessagesPage) {
        const notifChatId = data.data?.conversationId || data.url?.split('conversation=')[1];
        if (appState.activeChatId && notifChatId === appState.activeChatId) {
          return;
        }
      }

      // If app is focused but user is on a different page, we still suppress system push
      // and let the in-app toast system handle it for Case 1.
      return;
    }
  }

  // ── Build Native Mobile Notification Format ────────────────────────────────
  const title = data.title || 'EduSpace';
  
  // Requirement: App name + Branded icon + Title + Message preview
  const options = {
    body: data.body || 'New update available',
    icon: data.icon || '/pwa-192x192.png', // Corrected Branded Icon
    badge: data.badge || '/pwa-192x192.png',  // Corrected Monochrome badge
    image: data.image || data.icon || null, // Native-style large image preview
    tag: data.tag || getDefaultTag(data),
    renotify: true,
    timestamp: data.timestamp || Date.now(),
    dir: 'auto',
    lang: 'en-US',
    data: {
      url: data.url || '/',
      type: data.type,
      notificationId: data.data?.notificationId, // To mark as read on click
      ...data.data,
    },
    requireInteraction: data.type === 'call' || data.requireInteraction,
  };

  // Vibration pattern (Requirement 4: Vibration pattern)
  options.vibrate = data.vibrate || getDefaultVibration(data.type);

  // Requirement: Sound (if allowed)
  options.silent = false;

  // Requirement: Image preview (for messages/media)
  if (data.image) {
    options.image = data.image;
  }

  // Click Actions
  options.actions = data.actions || getDefaultActions(data.type);

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
      return [100, 50, 100];
    case 'assignment':
    case 'submission':
      return [200, 100, 200];
    case 'announcement':
    case 'schedule':
      return [200, 100, 200, 100, 200];
    case 'call':
      return [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]; // Aggressive repeating vibration
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
    case 'call':
      return [
        { action: 'accept', title: '✅ Answer' },
        { action: 'decline', title: '❌ Reject' },
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

  console.log('[SW] Notification clicked:', event.action, 'URL:', urlToOpen);

  // Handle specific action button clicks
  if (event.action === 'dismiss' || event.action === 'decline') {
    return; // Just close the notification
  }

  // Handle call acceptance
  if (event.action === 'accept') {
    const clickUrl = urlToOpen + (urlToOpen.includes('?') ? '&' : '?') + 'action=accept';
    console.log('[SW] Accept action, opening:', clickUrl);
    event.waitUntil(openOrFocusWindow(clickUrl));
    return;
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
  console.log('[SW] Attempting to open/focus:', urlToOpen);
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  // Try to find an existing window with our origin to focus & navigate
  for (const client of clientList) {
    try {
      const clientUrl = new URL(client.url);
      const targetUrl = new URL(urlToOpen, self.location.origin);

      if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
        console.log('[SW] Found existing client, focusing...');
        const focused = await client.focus();
        if (focused && focused.navigate) {
          console.log('[SW] Navigating existing client to:', urlToOpen);
          return focused.navigate(urlToOpen);
        }
        return focused;
      }
    } catch (e) {
      console.error('[SW] URL parsing/focus failed for client:', e);
    }
  }

  // No existing window — open a new one
  if (self.clients.openWindow) {
    console.log('[SW] No existing client found, opening new window...');
    return self.clients.openWindow(urlToOpen);
  }
}
