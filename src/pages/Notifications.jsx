import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        'NOTIFICATION HISTORY ERROR:',
        error
      )

      setError(
        'Unable to load notification history.'
      )

      setLoading(false)
      return
    }

    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  function formatDate(date) {
    return new Date(date).toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  return (
    <div className="admin-dashboard">

      <div className="admin-header">
        <div>
          <p className="section-label">
            NOTIFICATION HISTORY
          </p>

          <h1>📢 Notifications</h1>

          <p>
            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
          </p>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/admin"
            className="refresh-btn"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="admin-section">

        <p className="section-label">
          RECENT UPDATES
        </p>

        <h2>Notification History</h2>

        <p
          style={{
            color: '#aaa',
            marginBottom: '30px',
          }}
        >
          Notifications are automatically removed
          after 48 hours.
        </p>

        {loading && (
          <p style={{ color: '#aaa' }}>
            Loading notifications...
          </p>
        )}

        {error && (
          <div
            style={{
              padding: '15px',
              borderRadius: '8px',
              background:
                'rgba(255,70,70,0.1)',
              color: '#ff6b6b',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {!loading &&
          notifications.length === 0 && (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#888',
                border: '1px solid #333',
                borderRadius: '10px',
              }}
            >
              📭 No notifications yet.
            </div>
          )}

        <div
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          {notifications.map(
            (notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: '#111',
                  border: '1px solid #333',
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: '10px',
                    color: '#fff',
                  }}
                >
                  📢 {notification.title}
                </h3>

                <p
                  style={{
                    color: '#ccc',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {notification.message}
                </p>

                {notification.image_url && (
                  <div
                    style={{
                      marginTop: '15px',
                      marginBottom: '15px',
                    }}
                  >
                    <img
                      src={notification.image_url}
                      alt={notification.title}
                      style={{
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: '10px',
                        background: '#000',
                      }}
                    />
                  </div>
                )}

                <p
                  style={{
                    color: '#777',
                    fontSize: '13px',
                    marginBottom: 0,
                  }}
                >
                  🕒{' '}
                  {formatDate(
                    notification.created_at
                  )}
                </p>

                {notification.url &&
                  notification.url !== '/' && (
                    <Link
                      to={notification.url}
                      className="secondary-btn"
                      style={{
                        display: 'inline-block',
                        marginTop: '15px',
                      }}
                    >
                      Open →
                    </Link>
                  )}

              </div>
            )
          )}
        </div>

      </div>

    </div>
  )
}

export default Notifications