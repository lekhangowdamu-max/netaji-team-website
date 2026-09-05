import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import teamLogo from '../assets/team-logo.jpg'

function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchMembers()
    checkAdmin()
  }, [])

  // ==========================================
  // FETCH MEMBERS
  // ==========================================

  async function fetchMembers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error loading members:', error)
      setError(error.message)
    } else {
      console.log('MEMBERS FROM DATABASE:', data)

      data?.forEach((member) => {
        console.log(
          `MEMBER ${member.id} PHOTO:`,
          member.profile_image
        )
      })

      setMembers(data || [])
      setError('')
    }

    setLoading(false)
  }

  // ==========================================
  // CHECK ADMIN
  // ==========================================

  async function checkAdmin() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setIsAdmin(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error(
          'Admin profile check error:',
          error
        )

        setIsAdmin(false)
        return
      }

      setIsAdmin(data?.role === 'admin')

    } catch (error) {
      console.error(
        'Admin check error:',
        error
      )

      setIsAdmin(false)
    }
  }

  // ==========================================
  // DELETE MEMBER
  // ==========================================

  async function deleteMember(member) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.name} from the team?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(member.id)
    setError('')

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)

      if (error) {
        console.error(
          'Delete member error:',
          error
        )

        throw error
      }

      setMembers((currentMembers) =>
        currentMembers.filter(
          (item) => item.id !== member.id
        )
      )

      alert(
        `${member.name} has been removed from the team.`
      )

    } catch (error) {
      console.error(
        'Delete member error:',
        error
      )

      setError(
        `Unable to delete member: ${error.message}`
      )

    } finally {
      setDeletingId(null)
    }
  }

  // ==========================================
  // IMAGE ERROR HANDLER
  // ==========================================

  function handleImageError(e, member) {
    console.error(
      'MEMBER PHOTO FAILED TO LOAD:',
      member.profile_image
    )

    console.error(
      'MEMBER:',
      member.name,
      'ID:',
      member.id
    )

    // Show team logo if member photo cannot load
    e.currentTarget.src = teamLogo
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="members-page">

        <div className="members-header">

          <h1>
            ನಮ್ಮ ತಂಡದ ಸದಸ್ಯರು
          </h1>

          <p>
            Loading...
          </p>

        </div>

      </div>
    )
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="members-page">

      {/* HEADER */}

      <div className="members-header">

        <h1>
          ನಮ್ಮ ತಂಡದ ಸದಸ್ಯರು
        </h1>

        <p>
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </p>

      </div>

      {/* ERROR */}

      {error && (
        <p
          style={{
            color: '#ff6b6b',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          {error}
        </p>
      )}

      {/* NO MEMBERS */}

      {members.length === 0 && !error && (
        <p
          style={{
            color: '#aaa',
            textAlign: 'center',
          }}
        >
          ಇನ್ನೂ ಯಾವುದೇ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.
        </p>
      )}

      {/* MEMBERS */}

      <div className="members-list">

        {members.map((member) => (

          <div
            className="member-profile"
            key={member.id}
          >

            {/* ================================= */}
            {/* MEMBER IMAGE */}
            {/* ================================= */}

            <img
              src={
                member.profile_image
                  ? member.profile_image
                  : teamLogo
              }
              alt={member.name}
              className="member-profile-image"
              onError={(e) =>
                handleImageError(e, member)
              }
            />

            {/* ================================= */}
            {/* MEMBER INFORMATION */}
            {/* ================================= */}

            <div className="member-info">

              <h2>
                {member.name}
              </h2>

              <p className="member-role">
                {member.role}
              </p>

              {/* PHONE */}

              {member.phone && (
                <p className="member-phone">
                  📞 {member.phone}
                </p>
              )}

              {/* ACTIONS */}

              <div className="member-actions">

                {/* CALL */}

                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                  >
                    📞 Call
                  </a>
                )}

                {/* WHATSAPP */}

                {member.whatsapp && (
                  <a
                    href={`https://wa.me/91${member.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                )}

                {/* ADMIN ONLY */}

                {isAdmin && (
                  <>

                    {/* EDIT */}

                    <a
                      href={`/edit-member/${member.id}`}
                    >
                      ✏️ Edit
                    </a>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        deleteMember(member)
                      }
                      disabled={
                        deletingId === member.id
                      }
                      style={{
                        background:
                          deletingId === member.id
                            ? '#555'
                            : '#dc3545',

                        color: '#fff',

                        border: 'none',

                        padding: '8px 12px',

                        borderRadius: '6px',

                        cursor:
                          deletingId === member.id
                            ? 'not-allowed'
                            : 'pointer',

                        fontSize: '14px',

                        fontWeight: '600',
                      }}
                    >
                      {deletingId === member.id
                        ? 'Deleting...'
                        : '🗑️ Delete'}
                    </button>

                  </>
                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

export default Members