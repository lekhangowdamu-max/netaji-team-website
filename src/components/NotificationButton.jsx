import { useState } from 'react'
import { subscribeToNotifications } from '../notifications/pushNotifications'

function NotificationButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleEnableNotifications() {
    setLoading(true)
    setMessage('')

    const result = await subscribeToNotifications()

    setMessage(result.message)
    setLoading(false)
  }

  return (
    <div className="notification-box">
      <button
        onClick={handleEnableNotifications}
        disabled={loading}
        className="primary-btn"
      >
        {loading
          ? 'Enabling...'
          : '🔔 Enable Notifications'}
      </button>

      {message && (
        <p style={{ color: '#aaa', marginTop: '12px' }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default NotificationButton