/* Firebase Messaging service worker.
   Values are injected from public Firebase config by replacing this file during deployment if needed. */
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const notification = payload.notification || {}
  const data = payload.data || {}

  event.waitUntil(
    self.registration.showNotification(notification.title || 'S-Loco Admin', {
      body: notification.body || 'Bạn có thông báo mới.',
      icon: '/window.svg',
      data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const actionUrl = event.notification.data?.actionUrl || '/dashboard/notifications'
  event.waitUntil(clients.openWindow(actionUrl))
})
