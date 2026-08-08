import { Contest } from '@/types/contest';
import { toast } from 'sonner';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for background Web Push and Contest Reminders
 */
export async function initNotificationService(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Service Worker or Web Notifications not supported in this browser.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.error('Failed to register Notification Service Worker:', err);
    return null;
  }
}

/**
 * Request Notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Schedule a background 15m pre-contest notification via Service Worker
 */
export async function scheduleContestNotification(contest: Contest): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    toast.error('Please enable notifications in your browser settings to receive alerts.');
    return false;
  }

  const reg = swRegistration || (await initNotificationService());
  if (reg && reg.active) {
    reg.active.postMessage({
      type: 'SCHEDULE_CONTEST_REMINDER',
      contestId: contest.id,
      contestName: contest.name,
      platform: contest.platform,
      startTimeIso: contest.startTime,
      contestUrl: contest.url,
    });
    return true;
  }

  return false;
}

/**
 * Cancel a background scheduled contest notification
 */
export async function cancelContestNotification(contestId: string): Promise<void> {
  const reg = swRegistration || (await initNotificationService());
  if (reg && reg.active) {
    reg.active.postMessage({
      type: 'CANCEL_CONTEST_REMINDER',
      contestId,
    });
  }
}

/**
 * Send an immediate test notification to verify Service Worker system notification banner
 */
export async function sendTestNotification(): Promise<boolean> {
  if (!('Notification' in window)) {
    toast.error('Web Notifications are not supported in this browser.');
    return false;
  }

  // Request or verify permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    toast.error('Notifications blocked! Click the lock 🔒 icon in your browser address bar and set Notifications to "Allow".');
    return false;
  }

  let bannerDispatched = false;

  // 1. Send via Service Worker Registration (Guaranteed System Notification Banner)
  try {
    if ('serviceWorker' in navigator) {
      let reg = swRegistration || (await initNotificationService());
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
      }

      if (reg) {
        if (reg.active) {
          reg.active.postMessage({ type: 'SHOW_TEST_NOTIFICATION' });
          bannerDispatched = true;
        } else if (reg.showNotification) {
          await reg.showNotification('⚡ EduSpace Contest Alert (Test)', {
            body: 'Notifications are working! You will receive alerts 1 hour before contests start.',
            icon: '/pwa-192x192.png',
            badge: '/favicon.png',
            tag: 'test-notification-' + Date.now(),
            requireInteraction: true,
          });
          bannerDispatched = true;
        }
      }
    }
  } catch (swErr) {
    console.warn('Service Worker notification failed, trying direct window Notification:', swErr);
  }

  // 2. Direct Window Notification Fallback
  if (!bannerDispatched) {
    try {
      const n = new Notification('⚡ EduSpace Contest Alert (Test)', {
        body: 'Notifications are working! You will receive alerts 1 hour before contests start.',
        icon: '/pwa-192x192.png',
        requireInteraction: true,
      });
      n.onclick = () => window.focus();
      bannerDispatched = true;
    } catch (err) {
      console.error('Direct Notification API failed:', err);
    }
  }

  if (bannerDispatched) {
    toast.success('⚡ Notification banner dispatched! Check your system notification banner or Action Center.');
    return true;
  }

  toast.error('Unable to display notification. Check Windows Do Not Disturb or browser notification permissions.');
  return false;
}


