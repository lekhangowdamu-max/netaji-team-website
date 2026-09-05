import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function InstallAndNotification() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // -----------------------------------
  // CHECK PWA INSTALLATION
  // -----------------------------------
  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()

      setInstallPrompt(event)
      setShowInstall(true)
    }

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    )

    // Check if app is already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setShowInstall(false)
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
    }
  }, [])

  // -----------------------------------
  // CHECK NOTIFICATION STATUS
  // -----------------------------------
  useEffect(() => {
    checkNotificationStatus()
  }, [])

  async function checkNotificationStatus() {
    if (!('Notification' in window)) {
      setShowNotification(false)
      return
    }

    // Already allowed
    if (Notification.permission === 'granted') {
      await checkSubscription()
      return
    }

    // Permission denied
    if (Notification.permission === 'denied') {
      setShowNotification(false)
      return
    }

    // Permission not requested yet
    setShowNotification(true)
  }

  // -----------------------------------
  // CHECK SUPABASE SUBSCRIPTION
  // -----------------------------------
  async function checkSubscription() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setShowNotification(false)
      return
    }

    const { data, error } = await supabase
      .from('notification_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      console.error('SUBSCRIPTION CHECK ERROR:', error)
      return
    }

    if (data && data.length > 0) {
      setShowNotification(false)
    } else {
      setShowNotification(true)
    }
  }

  // -----------------------------------
  // INSTALL APP
  // -----------------------------------
  async function handleInstall() {
    if (!installPrompt) {
      setMessage(
        'Please use Chrome or Edge and open the browser menu to install the app.'
      )
      return
    }

    installPrompt.prompt()

    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstall(false)
      setInstallPrompt(null)
    }
  }

  // -----------------------------------
  // ENABLE NOTIFICATIONS
  // -----------------------------------
  async function enableNotifications() {
    setLoading(true)
    setMessage('')

    try {
      if (!('Notification' in window)) {
        throw new Error(
          'Notifications are not supported on this browser.'
        )
      }

      const permission =
        await Notification.requestPermission()

      if (permission !== 'granted') {
        throw new Error(
          'Notification permission was not allowed.'
        )
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        throw new Error(
          'Please login as a team member before enabling notifications.'
        )
      }

      if (!('serviceWorker' in navigator)) {
        throw new Error(
          'Service Worker is not supported on this browser.'
        )
      }

      const registration =
        await navigator.serviceWorker.ready

      const vapidPublicKey =
        import.meta.env.VITE_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error(
          'VAPID public key is missing from environment variables.'
        )
      }

      const applicationServerKey =
        urlBase64ToUint8Array(vapidPublicKey)

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          })
      }

      const subscriptionJson =
        subscription.toJSON()

      const { error } = await supabase
        .from('notification_subscriptions')
        .upsert(
          {
            user_id: session.user.id,
            endpoint: subscriptionJson.endpoint,
            p256dh:
              subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
          },
          {
            onConflict: 'endpoint',
          }
        )

      if (error) {
        throw error
      }

      setShowNotification(false)

      setMessage(
        'Notifications enabled successfully! 🔔'
      )
    } catch (error) {
      console.error(
        'NOTIFICATION ERROR:',
        error
      )

      setMessage(
        error.message ||
          'Unable to enable notifications.'
      )
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------
  // BASE64 → UINT8ARRAY
  // -----------------------------------
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

  // -----------------------------------
  // NOTHING TO SHOW
  // -----------------------------------
  if (!showInstall && !showNotification && !message) {
    return null
  }

  return (
    <div className="setup-card">

      <div className="setup-card-content">

        <h2>
          📱 Stay Connected
        </h2>

        <p>
          Install our app and receive important
          team updates directly on your device.
        </p>

        <div className="setup-buttons">

          {showInstall && (
            <button
              onClick={handleInstall}
              className="setup-install-btn"
            >
              📲 Install App
            </button>
          )}

          {showNotification && (
            <button
              onClick={enableNotifications}
              className="setup-notification-btn"
              disabled={loading}
            >
              {loading
                ? '⏳ Enabling...'
                : '🔔 Enable Notifications'}
            </button>
          )}

        </div>

        {message && (
          <div className="setup-message">
            {message}
          </div>
        )}

      </div>

    </div>
  )
}

export default InstallAndNotification