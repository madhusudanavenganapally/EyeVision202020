// Service Worker for Eye2020 - handles background notifications

self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

// Handle scheduled notification messages from the main thread
self.addEventListener('message', function (event) {
    var data = event.data;

    if (data.type === 'SCHEDULE_NOTIFICATION') {
        var delay = data.delay;

        setTimeout(function () {
            self.registration.showNotification('Eye Care 20/20', {
                body: 'Time for a 20-second break! Look 20 feet away.',
                icon: '/EyeVision202020/favicon.ico',
                badge: '/EyeVision202020/favicon.ico',
                tag: 'eye-break-notification',
                requireInteraction: true,
                vibrate: [200, 100, 200]
            });
        }, delay);
    }

    if (data.type === 'CANCEL_NOTIFICATION') {
        // Close any existing notifications
        self.registration.getNotifications({ tag: 'eye-break-notification' }).then(function (notifications) {
            notifications.forEach(function (n) { n.close(); });
        });
    }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Focus or open the app
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(function (clients) {
            for (var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow('/EyeVision202020/');
        })
    );
});
