import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function EditMember() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState(null)
  const [currentPhoto, setCurrentPhoto] = useState('')

  const [memberUserId, setMemberUserId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loginCredentials, setLoginCredentials] = useState(null)

  useEffect(() => {
    fetchMember()
  }, [id])

  async function fetchMember() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Fetch member error:', error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setName(data.name || '')
    setRole(data.role || '')
    setPhone(data.phone || '')
    setWhatsapp(data.whatsapp || '')
    setEmail(data.email || '')
    setCurrentPhoto(data.profile_image || '')
    setMemberUserId(data.user_id || null)

    setLoading(false)
  }

  async function handleUpdate(e) {
    e.preventDefault()

    setSaving(true)
    setMessage('')
    setLoginCredentials(null)

    try {
      // =========================================
      // 1. Keep existing photo
      // =========================================

      let profileImage = currentPhoto || null

      console.log('OLD PROFILE IMAGE:', profileImage)

      // =========================================
      // 2. Upload new photo
      // =========================================

      if (photo) {
        const fileExt =
          photo.name.split('.').pop().toLowerCase()

        const fileName =
          `member-${id}-${Date.now()}.${fileExt}`

        console.log('UPLOADING PHOTO:', fileName)

        const { error: uploadError } =
          await supabase.storage
            .from('member-photos')
            .upload(fileName, photo, {
              cacheControl: '3600',
              upsert: false,
            })

        if (uploadError) {
          console.error(
            'PHOTO UPLOAD ERROR:',
            uploadError
          )

          throw uploadError
        }

        console.log(
          'PHOTO UPLOAD SUCCESS:',
          fileName
        )

        // =========================================
        // 3. Get public URL
        // =========================================

        const { data: publicUrlData } =
          supabase.storage
            .from('member-photos')
            .getPublicUrl(fileName)

        if (!publicUrlData?.publicUrl) {
          throw new Error(
            'Photo uploaded, but public URL could not be generated.'
          )
        }

        profileImage =
          publicUrlData.publicUrl

        console.log(
          'NEW PROFILE IMAGE URL:',
          profileImage
        )
      }

      // =========================================
      // 4. IMPORTANT DEBUG
      // =========================================

      console.log(
        'PROFILE IMAGE BEFORE DATABASE UPDATE:',
        profileImage
      )

      console.log(
        'MEMBER ID:',
        id
      )

      // =========================================
      // 5. Update member database
      // =========================================

      const {
        data: updatedMember,
        error: updateError,
      } = await supabase
        .from('members')
        .update({
          name,
          role,
          phone,
          whatsapp,
          email,
          profile_image: profileImage,
        })
        .eq('id', id)
        .select('id, profile_image')
        .single()

      // =========================================
      // 6. Check database update
      // =========================================

      if (updateError) {
        console.error(
          'DATABASE UPDATE ERROR:',
          updateError
        )

        throw updateError
      }

      console.log(
        'UPDATED MEMBER FROM DATABASE:',
        updatedMember
      )

      console.log(
        'SAVED PROFILE IMAGE:',
        updatedMember?.profile_image
      )

      // =========================================
      // 7. Make sure photo was actually saved
      // =========================================

      if (
        profileImage &&
        !updatedMember?.profile_image
      ) {
        throw new Error(
          'Photo URL was not saved in the members table.'
        )
      }

      // =========================================
      // 8. Account already exists
      // =========================================

      if (memberUserId) {
        setCurrentPhoto(
          updatedMember?.profile_image ||
          profileImage ||
          ''
        )

        setPhoto(null)

        setMessage(
          'Member updated successfully! ✅'
        )

        setSaving(false)
        return
      }

      // =========================================
      // 9. Get current admin
      // =========================================

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          'Admin login session not found.'
        )
      }

      // =========================================
      // 10. Create member account
      // =========================================

      const {
        data: accountData,
        error: functionError,
      } = await supabase.functions.invoke(
        'create-member-account',
        {
          body: {
            memberId: id,
            email,
            name,
          },
        }
      )

      if (functionError) {
        console.error(
          'EDGE FUNCTION ERROR:',
          functionError
        )

        let errorMessage =
          functionError.message

        if (functionError.context) {
          try {
            const errorBody =
              await functionError.context.json()

            console.error(
              'EDGE FUNCTION RESPONSE:',
              errorBody
            )

            if (errorBody?.error) {
              errorMessage =
                errorBody.error
            }
          } catch (e) {
            console.error(
              'Could not read Edge Function response'
            )
          }
        }

        throw new Error(errorMessage)
      }

      if (accountData?.error) {
        throw new Error(
          accountData.error
        )
      }

      // =========================================
      // 11. Store credentials
      // =========================================

      setLoginCredentials({
        username:
          accountData.username,

        password:
          accountData.temporaryPassword,
      })

      setCurrentPhoto(
        updatedMember?.profile_image ||
        profileImage ||
        ''
      )

      setPhoto(null)

      setMessage(
        'Member updated successfully! 🎉 Login account created.'
      )

      // Refresh data
      await fetchMember()

    } catch (error) {
      console.error(
        'UPDATE MEMBER ERROR:',
        error
      )

      setMessage(
        error.message ||
        'Unable to update member.'
      )
    }

    setSaving(false)
  }

  // =========================================
  // WhatsApp
  // =========================================

  function sendCredentialsOnWhatsApp() {
    if (!whatsapp) {
      alert(
        'This member does not have a registered WhatsApp number.'
      )
      return
    }

    if (!loginCredentials) {
      alert(
        'Login credentials are not available.'
      )
      return
    }

    let cleanNumber =
      whatsapp.replace(/\D/g, '')

    if (cleanNumber.length === 10) {
      cleanNumber =
        '91' + cleanNumber
    }

    if (
      cleanNumber.length === 13 &&
      cleanNumber.startsWith('091')
    ) {
      cleanNumber =
        cleanNumber.substring(1)
    }

    const websiteUrl =
      'https://netaji-team-website.vercel.app/'

    const whatsappMessage = `🙏 ನಮಸ್ಕಾರ ${name},

🎉 ನಿಮ್ಮ ಸದಸ್ಯರ ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ.

🪔 ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
📍 ಮರಳಿಗ

🌐 OFFICIAL MEMBER WEBSITE / APP

ನೀವು ಈಗ ನಮ್ಮ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ / ಆಪ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಬಹುದು.

🔐 LOGIN CREDENTIALS

👤 Username:
${loginCredentials.username}

🔑 Temporary Password:
${loginCredentials.password}

🌐 Login:
${websiteUrl}

⚠️ IMPORTANT

ದಯವಿಟ್ಟು ನಿಮ್ಮ Login Username ಮತ್ತು Password ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇಟ್ಟುಕೊಳ್ಳಿ.
ನಿಮ್ಮ Password ಅನ್ನು ಇತರರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.

🖼️ Official Team Logo:
https://cdn.corenexis.com/f/Q4tlN92ScN0.jpg

ಧನ್ಯವಾದಗಳು 🙏

ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ`

    const whatsappUrl =
      `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  // =========================================
  // Loading
  // =========================================

  if (loading) {
    return (
      <div className="about-section">

        <p className="section-label">
          ADMIN
        </p>

        <h2>
          Loading member...
        </h2>

      </div>
    )
  }

  // =========================================
  // Page
  // =========================================

  return (
    <div className="about-section">

      <p className="section-label">
        ADMIN
      </p>

      <h2>
        Edit Member
      </h2>

      {/* Current Profile Photo */}

      {currentPhoto && (
        <img
          src={currentPhoto}
          alt={name}
          style={{
            width: '150px',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '50%',
            marginBottom: '20px',
          }}
        />
      )}

      <form
        onSubmit={handleUpdate}
        className="login-form"
      >

        <input
          type="text"
          placeholder="Member Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          required
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <input
          type="tel"
          placeholder="WhatsApp Number"
          value={whatsapp}
          onChange={(e) =>
            setWhatsapp(e.target.value)
          }
        />

        <div className="form-group">

          <label>
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter member's registered email"
            required
          />

        </div>

        <label>
          Change Photo
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setPhoto(
              e.target.files?.[0] || null
            )
          }
        />

        <button
          type="submit"
          className="primary-btn"
          disabled={saving}
        >
          {saving
            ? 'Updating...'
            : 'Update Member'}
        </button>

      </form>

      {/* Message */}

      {message && (
        <p
          style={{
            color: '#aaa',
            marginTop: '20px',
          }}
        >
          {message}
        </p>
      )}

      {/* Login credentials */}

      {loginCredentials && (
        <div
          style={{
            marginTop: '25px',
            padding: '20px',
            borderRadius: '12px',
            background: '#1a1a1a',
            border: '1px solid #333',
          }}
        >

          <h3
            style={{
              marginBottom: '15px',
            }}
          >
            🔐 Member Login Credentials
          </h3>

          <p>
            <strong>
              Username:
            </strong>

            <br />

            {loginCredentials.username}
          </p>

          <p>
            <strong>
              Temporary Password:
            </strong>

            <br />

            {loginCredentials.password}
          </p>

          <button
            type="button"
            className="primary-btn"
            style={{
              marginTop: '10px',
              background: '#25D366',
              color: '#fff',
            }}
            onClick={
              sendCredentialsOnWhatsApp
            }
          >
            📱 Send Credentials on WhatsApp
          </button>

        </div>
      )}

    </div>
  )
}

export default EditMember