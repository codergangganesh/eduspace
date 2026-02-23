importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// These values should be replaced with actual project values from .env
const firebaseConfig = {
  apiKey: "AIzaSyDsTmtfjVl4wFiVRMby9acYPSRADaxcvf8",
  authDomain: "eduspace-da1ae.firebaseapp.com",
  projectId: "eduspace-da1ae",
  storageBucket: "eduspace-da1ae.firebasestorage.app",
  messagingSenderId: "755677421309",
  appId: "1:755677421309:web:3619ccecff760a99e66894"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  
  // Note: For background messages, payload.data is preferred over payload.notification
  // if you want full control over the notification display.
  
  if (data.type === 'incoming_call') {
    const notificationTitle = title || 'Incoming Call';
    const notificationOptions = {
      body: body || `${data.callerName || 'Someone'} is calling you...`,
      icon: data.callerAvatar || '/pwa-192x192.png',
      badge: '/favicon.png',
      tag: 'incoming-call',
      requireInteraction: true,
      data: data,
      actions: [
        {
          action: 'accept',
          title: 'Accept',
        },
        {
          action: 'reject',
          title: 'Reject',
        }
      ],
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      silent: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  } else {
    // Normal notification
    const notificationTitle = title || 'New Notification';
    const notificationOptions = {
      body: body || '',
      icon: '/pwa-192x192.png',
      data: data
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'accept') {
    // Open the app to the conversation page with action=accept
    // Use roomId if sessionId is missing (we sent both in backend)
    const sid = data.sessionId || data.roomId;
    const urlToOpen = new URL(`/messages?session=${sid}&action=accept`, self.location.origin).href;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (action === 'reject') {
    console.log('Call rejected');
  } else {
    const urlToOpen = new URL(data.url || '/', self.location.origin).href;
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});
