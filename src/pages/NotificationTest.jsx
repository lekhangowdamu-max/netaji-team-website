import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { subscribeToNotifications } from '../notifications/pushNotifications'

function NotificationTest() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEnable() {
    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('Please login first.')
        setLoading(false)
        return
      }

      const result = await subscribeToNotifications()

      setMessage(result.message)
    } catch (error) {
      console.error('NOTIFICATION TEST ERROR:', error)
      setMessage(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="website">
      <section className="about-section">
        <p className="section-label">
          NOTIFICATION TEST
        </p>

        <h2>🔔 Enable Notifications</h2>

        <p style={{ color: '#aaa', marginBottom: '25px' }}>
          Enable notifications to receive updates
          from ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ.
        </p>

        <button
          onClick={handleEnable}
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? 'Enabling...'
            : '🔔 Enable Notifications'}
        </button>

        {message && (
          <p
            style={{
              marginTop: '20px',
              color: '#aaa',
            }}
          >
            {message}
          </p>
        )}

        <br />

        <a
          href="/"
          className="secondary-btn"
        >
          Back to Home
        </a>
      </section>
    </div>
  )
}

export default NotificationTest