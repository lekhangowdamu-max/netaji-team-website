import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function SendNotification() {
  const navigate = useNavigate()

  const [title, setTitle] = useState(
    'ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ'
  )

  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('/')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSend(e) {
    e.preventDefault()

    if (!message.trim()) {
      setError('Please enter a notification message.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Get current logged-in user/session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setError('Your login session has expired. Please login again.')
        setLoading(false)
        return
      }

      // Verify admin before calling the function
      const { data: admin, error: adminError } =
        await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle()

      if (adminError) {
        throw adminError
      }

      if (!admin) {
        setError('Only the admin can send notifications.')
        setLoading(false)
        return
      }
      const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  throw new Error(
    'You must be logged in.'
  )
}
const { error: saveError } =
  await supabase
    .from('notifications')
    .insert({
      title,
      message,
      url,
      created_by: user.id,
    })

if (saveError) {
  throw saveError
}

      // Call secure Edge Function
      const { data, error: functionError } =
        await supabase.functions.invoke(
          'send-push-notification',
          {
            body: {
              title: title.trim(),
              body: message.trim(),
              url: url || '/',
            },
          }
        )

      if (functionError) {
        console.error(
          'Notification function error:',
          functionError
        )

        throw new Error(
          functionError.message ||
          'Unable to send notification.'
        )
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setResult(data)

      setMessage('')

    } catch (error) {
      console.error(
        'SEND NOTIFICATION ERROR:',
        error
      )

      setError(
        error.message ||
        'Unable to send notification.'
      )
    }

    setLoading(false)
  }

  return (
    <div className="admin-dashboard">

      {/* Header */}

      <div className="admin-header">

        <div>

          <p className="section-label">
            NOTIFICATION CENTER
          </p>

          <h1>
            🔔 Send Notification
          </h1>

          <p>
            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
          </p>

        </div>

        <div className="admin-header-actions">

          <button
            onClick={() => navigate('/admin')}
            className="refresh-btn"
          >
            ← Dashboard
          </button>

        </div>

      </div>


      {/* Notification Form */}

      <div className="admin-section">

        <p className="section-label">
          SEND UPDATE
        </p>

        <h2>
          Notify Team Members
        </h2>

        <p style={{ color: '#aaa', marginBottom: '30px' }}>
          Send an instant notification to members who
          have enabled notifications.
        </p>


        <form
          onSubmit={handleSend}
          className="login-form"
        >

          {/* Title */}

          <label>
            Notification Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Enter notification title"
            required
          />


          {/* Message */}

          <label>
            Message
          </label>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Enter notification message"
            rows="5"
            required
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#111',
              color: '#fff',
              fontSize: '16px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />


          {/* URL */}

          <label>
            Open Page After Clicking
          </label>

          <select
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#111',
              color: '#fff',
              fontSize: '16px',
            }}
          >
            <option value="/">
              Home
            </option>

            <option value="/members">
              Members
            </option>

            <option value="/gallery">
              Gallery
            </option>
          </select>


          {/* Error */}

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 70, 70, 0.1)',
                color: '#ff6b6b',
              }}
            >
              ⚠️ {error}
            </div>
          )}


          {/* Success */}

          {result && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: '8px',
                background: 'rgba(50, 200, 100, 0.1)',
                color: '#7ee787',
              }}
            >
              <strong>
                ✅ Notification sent successfully!
              </strong>

              <p>
                Subscribers: {result.totalSubscriptions}
              </p>

              <p>
                Sent: {result.sent}
              </p>

              <p>
                Failed: {result.failed}
              </p>
            </div>
          )}


          {/* Send */}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? 'Sending...'
              : '🔔 Send Notification'}
          </button>

        </form>

      </div>


      {/* Information */}

      <div className="admin-section">

        <p className="section-label">
          INFORMATION
        </p>

        <h2>
          How Notifications Work
        </h2>

        <p style={{ color: '#aaa' }}>
          Only members who have logged in and enabled
          browser notifications can receive notifications.
        </p>

        <p style={{ color: '#aaa' }}>
          The notification will appear on their device
          even when they are not currently viewing the
          website, depending on their browser and device
          settings.
        </p>

        <br />

        <Link
          to="/admin"
          className="secondary-btn"
        >
          ← Back to Admin Dashboard
        </Link>

      </div>

    </div>
  )
}

export default SendNotification