import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

// PUSH NOTIFICATION
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data

  try {
    data = event.data.json()
  } catch (error) {
    console.error('Unable to read push notification data:', error)
    return
  }

  const title =
    data.title ||
    'ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ'

  const options = {
    body:
      data.body ||
      'ನಿಮಗೆ ಹೊಸ ಅಪ್‌ಡೇಟ್ ಇದೆ.',

    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',

    data: {
      url: data.url || '/',
      image: data.image || null,
    },

    requireInteraction: false,

    vibrate: [200, 100, 200],
  }

  // Add notification image when supplied.
  if (data.image) {
    options.image = data.image
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

// NOTIFICATION CLICK
self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()

    const url =
      event.notification.data?.url || '/'

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(url)
              return client.focus()
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
)