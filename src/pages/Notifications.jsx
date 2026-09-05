import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'NOTIFICATIONS ERROR:',
        error
      )

      setError(
        'Unable to load notifications.'
      )

      setLoading(false)
      return
    }

    setNotifications(data || [])
    setLoading(false)
  }

  function formatDate(dateString) {
    return new Date(
      dateString
    ).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="notifications-page">

      <div className="notifications-header">

        <Link
          to="/"
          className="back-home-btn"
        >
          ← Home
        </Link>

        <h1>
          🔔 Notifications
        </h1>

        <p>
          Important updates from
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </p>

      </div>

      {loading && (
        <div className="notifications-status">
          Loading notifications...
        </div>
      )}

      {error && (
        <div className="notifications-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div className="notifications-empty">
            <div className="empty-icon">
              🔔
            </div>

            <h2>
              No notifications yet
            </h2>

            <p>
              New team announcements
              will appear here.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        notifications.length > 0 && (

          <div className="notifications-list">

            {notifications.map(
              (notification) => (

                <div
                  className="notification-card"
                  key={notification.id}
                >

                  <div className="notification-icon">
                    📢
                  </div>

                  <div className="notification-content">

                    <h2>
                      {notification.title}
                    </h2>

                    <p>
                      {notification.message}
                    </p>

                    <span className="notification-date">
                      {formatDate(
                        notification.created_at
                      )}
                    </span>

                    {notification.url &&
                      notification.url !== '/' && (

                        <Link
                          to={notification.url}
                          className="notification-open-btn"
                        >
                          Open →
                        </Link>

                      )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

    </div>
  )
}

export default Notifications