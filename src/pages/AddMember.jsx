import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function AddMember() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [photo, setPhoto] = useState(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [createdMemberName, setCreatedMemberName] = useState('')
  const [loginCredentials, setLoginCredentials] = useState(null)
  const [createdWhatsapp, setCreatedWhatsapp] = useState('')

  useEffect(() => {
    getUser()
  }, [])

  async function getUser() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error(error)
      return
    }

    if (data.user) {
      console.log('Logged in admin:', data.user.id)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setLoginCredentials(null)

    try {
      // 1. Check admin login
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Admin login session not found.')
      }

      const adminUserId = userData.user.id

      // 2. Upload photo
      let profileImage = null

      if (photo) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`

        const {
          error: uploadError,
        } = await supabase.storage
          .from('member-photos')
          .upload(fileName, photo)

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('member-photos')
          .getPublicUrl(fileName)

        profileImage = data.publicUrl
      }

      // 3. Add member
      const {
        data: newMember,
        error: insertError,
      } = await supabase
        .from('members')
        .insert({
          user_id: null,
          created_by: adminUserId,
          name,
          role,
          phone,
          whatsapp,
          email,
          profile_image: profileImage,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // 4. Create member login account
      const {
        data: accountData,
        error: functionError,
      } = await supabase.functions.invoke(
        'create-member-account',
        {
          body: {
            memberId: newMember.id,
            email,
            name,
          },
        }
      )

      // 5. Handle Edge Function error
      if (functionError) {
        console.error(
          'Edge Function error:',
          functionError
        )

        let errorMessage = functionError.message

        if (functionError.context) {
          try {
            const errorBody =
              await functionError.context.json()

            console.error(
              'Edge Function response:',
              errorBody
            )

            if (errorBody?.error) {
              errorMessage = errorBody.error
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
        throw new Error(accountData.error)
      }

      // 6. Save credentials
      setLoginCredentials({
        username: accountData.username,
        password: accountData.temporaryPassword,
      })

      // Save member information for WhatsApp
      setCreatedMemberName(name)
      setCreatedWhatsapp(whatsapp || phone)

      // 7. Success
      setMessage(
        'Member added successfully! 🎉 Login account created.'
      )

      // 8. Clear form
      setName('')
      setRole('')
      setPhone('')
      setWhatsapp('')
      setEmail('')
      setPhoto(null)

    } catch (error) {
      console.error(
        'Add member error:',
        error
      )

      setMessage(error.message)
    }

    setLoading(false)
  }

  function sendCredentialsOnWhatsApp() {
    const phoneNumber = createdWhatsapp

    if (!phoneNumber) {
      alert(
        'This member does not have a WhatsApp number.'
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
      phoneNumber.replace(/\D/g, '')

    // Indian number
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber
    }

    const websiteUrl =
      window.location.origin

    const whatsappMessage = `🙏 ನಮಸ್ಕಾರ ${createdMemberName || 'Member'},

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

  return (
    <div className="about-section">

      <p className="section-label">
        ADMIN
      </p>

      <h2>
        Add New Member
      </h2>

      <form
        onSubmit={handleSubmit}
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
            placeholder="Enter member's email address"
            required
          />

        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setPhoto(e.target.files[0])
          }
        />

        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? 'Adding Member...'
            : 'Add Member'}
        </button>

      </form>

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

      {/* LOGIN CREDENTIALS */}
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

export default AddMember