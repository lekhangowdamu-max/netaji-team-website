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

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // --------------------------------------------------
  // PHOTO SELECTION
  // --------------------------------------------------

  function handleImageChange(e) {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    // Maximum 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  // --------------------------------------------------
  // REMOVE PHOTO
  // --------------------------------------------------

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(null)
    setImagePreview('')
  }

  // --------------------------------------------------
  // SEND NOTIFICATION
  // --------------------------------------------------

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
      // --------------------------------------------------
      // GET CURRENT SESSION
      // --------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setError(
          'Your login session has expired. Please login again.'
        )

        setLoading(false)
        return
      }

      // --------------------------------------------------
      // VERIFY ADMIN
      // --------------------------------------------------

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
        setError(
          'Only the admin can send notifications.'
        )

        setLoading(false)
        return
      }

      // --------------------------------------------------
      // GET USER
      // --------------------------------------------------

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in.')
      }

      // --------------------------------------------------
      // UPLOAD IMAGE
      // --------------------------------------------------

      let imageUrl = null

      if (imageFile) {
        const fileExtension =
          imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'

        const fileName =
          `notification-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${fileExtension}`

        const { error: uploadError } =
          await supabase.storage
            .from('notification-images')
            .upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageFile.type,
            })

        if (uploadError) {
          console.error(
            'IMAGE UPLOAD ERROR:',
            uploadError
          )

          throw new Error(
            'Unable to upload the notification photo.'
          )
        }

        // Get public URL
        const { data: publicUrlData } =
          supabase.storage
            .from('notification-images')
            .getPublicUrl(fileName)

        imageUrl =
          publicUrlData?.publicUrl || null
      }

      // --------------------------------------------------
      // SAVE NOTIFICATION HISTORY
      // --------------------------------------------------

      const { error: saveError } =
        await supabase
          .from('notifications')
          .insert({
            title: title.trim(),
            message: message.trim(),
            url: url || '/',
            image_url: imageUrl,
            created_by: user.id,
          })

      if (saveError) {
        console.error(
          'SAVE NOTIFICATION ERROR:',
          saveError
        )

        throw saveError
      }

      // --------------------------------------------------
      // SEND PUSH NOTIFICATION
      // --------------------------------------------------

      const { data, error: functionError } =
        await supabase.functions.invoke(
          'send-push-notification',
          {
            body: {
              title: title.trim(),
              body: message.trim(),
              url: url || '/',
              image: imageUrl,
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

      // --------------------------------------------------
      // SUCCESS
      // --------------------------------------------------

      setResult(data)

      setMessage('')

      removeImage()

    } catch (error) {
      console.error(
        'SEND NOTIFICATION ERROR:',
        error
      )

      setError(
        error?.message ||
        'Unable to send notification.'
      )
    }

    setLoading(false)
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="admin-dashboard">

      {/* HEADER */}

      <div className="admin-header">

        <div>

          <p className="section-label">
            NOTIFICATION CENTER
          </p>

          <h1>
            📢✨ Send Notification
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


      {/* NOTIFICATION FORM */}

      <div className="admin-section">

        <p className="section-label">
          SEND UPDATE
        </p>

        <h2>
          Notify Team Members
        </h2>

        <p
          style={{
            color: '#aaa',
            marginBottom: '30px',
          }}
        >
          Send an instant notification to members who
          have enabled notifications.
        </p>


        <form
          onSubmit={handleSend}
          className="login-form"
        >

          {/* TITLE */}

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


          {/* MESSAGE */}

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


          {/* PHOTO ATTACHMENT */}

          <label>
            📷 Attach Photo
          </label>

          <div
            style={{
              border: '1px dashed #555',
              borderRadius: '10px',
              padding: '20px',
              background: '#111',
              marginBottom: '10px',
            }}
          >

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: '100%',
                color: '#fff',
                fontSize: '15px',
              }}
            />

            <p
              style={{
                color: '#777',
                fontSize: '13px',
                marginTop: '10px',
                marginBottom: 0,
              }}
            >
              JPG, PNG, WEBP and other image formats.
              Maximum size: 5 MB.
            </p>

          </div>


          {/* PHOTO PREVIEW */}

          {imagePreview && (
            <div
              style={{
                marginTop: '15px',
                marginBottom: '20px',
                padding: '15px',
                borderRadius: '10px',
                background: '#151515',
                border: '1px solid #333',
              }}
            >

              <p
                style={{
                  color: '#aaa',
                  marginTop: 0,
                  marginBottom: '10px',
                }}
              >
                🖼️ Selected Photo
              </p>

              <img
                src={imagePreview}
                alt="Notification preview"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '500px',
                  maxHeight: '350px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  background: '#000',
                  marginBottom: '15px',
                }}
              />

              <button
                type="button"
                onClick={removeImage}
                style={{
                  padding: '10px 16px',
                  borderRadius: '7px',
                  border: '1px solid #555',
                  background: '#222',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                ❌ Remove Photo
              </button>

            </div>
          )}


          {/* OPEN URL */}

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


          {/* ERROR */}

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                borderRadius: '8px',
                background:
                  'rgba(255, 70, 70, 0.1)',
                color: '#ff6b6b',
              }}
            >
              ⚠️ {error}
            </div>
          )}


          {/* SUCCESS */}

          {result && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: '8px',
                background:
                  'rgba(50, 200, 100, 0.1)',
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


          {/* SEND BUTTON */}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? 'Sending...'
              : '📢✨ Send Notification'}
          </button>

        </form>

      </div>


      {/* INFORMATION */}

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
          You can now attach a photo to your notification.
          The photo is uploaded securely to Supabase Storage
          and saved with the notification history.
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