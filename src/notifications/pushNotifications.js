import { supabase } from '../lib/supabase'
console.log(
  'VAPID PUBLIC KEY:',
  import.meta.env.VITE_VAPID_PUBLIC_KEY
)

export async function subscribeToNotifications() {
  try {
    if (!('Notification' in window)) {
      console.log('Notifications are not supported.')
      return {
        success: false,
        message: 'Notifications are not supported on this device.',
      }
    }

    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported.')
      return {
        success: false,
        message: 'Service workers are not supported.',
      }
    }

    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was not granted.',
      }
    }

    const registration =
      await navigator.serviceWorker.ready

    console.log(
      'Service worker ready:',
      registration
    )

    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        ),
      })

    const subscriptionJSON =
      subscription.toJSON()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Please log in first.',
      }
    }

    const { error } = await supabase
      .from('notification_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh,
          auth: subscriptionJSON.keys?.auth,
        },
        {
          onConflict: 'endpoint',
        }
      )

    if (error) {
      console.error(
        'Subscription database error:',
        error
      )

      return {
        success: false,
        message: error.message,
      }
    }

    console.log(
      'Notification subscription saved successfully.'
    )

    return {
      success: true,
      message: 'Notifications enabled successfully!',
    }
  } catch (error) {
    console.error(
      'Notification subscription error:',
      error
    )

    return {
      success: false,
      message:
        error.message ||
        'Unable to enable notifications.',
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding =
    '='.repeat(
      (4 - (base64String.length % 4)) % 4
    )

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  )
}