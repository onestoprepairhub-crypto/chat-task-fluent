// Service Worker for handling notification actions

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const taskId = notification.data?.taskId;

  notification.close();

  if (!taskId) {
    // Just focus the window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
    return;
  }

  // Handle action buttons
  if (action === 'snooze30') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: 'snooze',
            taskId,
            minutes: 30,
          });
        });
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
      })
    );
  } else if (action === 'snooze120') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: 'snooze',
            taskId,
            minutes: 120,
          });
        });
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
      })
    );
  } else if (action === 'complete') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: 'complete',
            taskId,
          });
        });
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
      })
    );
  } else {
    // Default click - just focus the window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Handle push events
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Task reminder',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      tag: data.taskId,
      actions: [
        { action: 'snooze30', title: '⏰ 30 min' },
        { action: 'snooze120', title: '⏰ 2 hours' },
        { action: 'complete', title: '✅ Done' },
      ],
      data: { taskId: data.taskId },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Task Reminder', options)
    );
  }
});
