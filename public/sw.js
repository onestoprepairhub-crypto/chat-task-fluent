// Service Worker for iOS and Web Push Notifications
// This service worker handles push events when the app is closed/background

const SW_VERSION = '1.0.0';
console.log('[SW] Service Worker version:', SW_VERSION);

// Install event - take control immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications (works in background!)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = {
    title: 'Task Reminder',
    body: 'You have a task to complete',
    taskId: null,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.log('[SW] Push data parse error:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.taskId || 'task-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { 
      taskId: data.taskId,
      url: data.url || '/',
    },
    actions: [
      { action: 'snooze30', title: '⏰ 30 min' },
      { action: 'snooze120', title: '⏰ 2 hours' },
      { action: 'complete', title: '✅ Done' },
    ],
  };

  console.log('[SW] Showing notification:', data.title, options);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  const notification = event.notification;
  const action = event.action;
  const taskId = notification.data?.taskId;
  const targetUrl = notification.data?.url || '/';

  notification.close();

  // Handle action buttons
  if (action === 'snooze30' || action === 'snooze120' || action === 'complete') {
    const minutes = action === 'snooze30' ? 30 : action === 'snooze120' ? 120 : 0;
    const actionType = action === 'complete' ? 'complete' : 'snooze';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Post message to all clients
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: actionType,
            taskId,
            minutes,
          });
        });
        
        // Focus existing window or open new one
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow(targetUrl);
      })
    );
  } else {
    // Default click - open/focus the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If we have an open window, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl);
      })
    );
  }
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    }).then((subscription) => {
      console.log('[SW] Resubscribed:', subscription.endpoint);
      // Notify the app about resubscription
      return clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: subscription.toJSON(),
          });
        });
      });
    })
  );
});
