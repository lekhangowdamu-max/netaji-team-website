import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import teamLogo from '../assets/team-logo.jpg'

function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessRole, setAccessRole] = useState('visitor')
  const [deletingId, setDeletingId] = useState(null)

  const canSeeDetails = accessRole === 'admin' || accessRole === 'member'
  const isAdmin = accessRole === 'admin'

  useEffect(() => {
    let active = true

    async function refreshMembers() {
      await loadMembers(() => active)
    }

    refreshMembers()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshMembers()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadMembers(isActive = () => true) {
    if (!isActive()) return
    setLoading(true)
    setError('')

    try {
      const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser()

// A missing session is normal for public visitors.
if (
  authError &&
  authError.name !== 'AuthSessionMissingError'
) {
  throw authError
}

      let role = 'visitor'
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError
        if (profile?.role === 'admin' || profile?.role === 'member') {
          role = profile.role
        }
      }

      if (!isActive()) return
      setAccessRole(role)

      // Public visitors can request only profile pictures from the safe view.
      const query = role === 'visitor'
        ? supabase
            .from('member_public_profiles')
            .select('id, profile_image')
            .order('id', { ascending: true })
        : supabase
            .from('members')
            .select('*')
            .order('id', { ascending: true })

      const { data, error: membersError } = await query
      if (membersError) throw membersError
      if (!isActive()) return

      setMembers(data || [])
      setError('')
    } catch (err) {
      console.error('Error loading members:', err)
      if (!isActive()) return
      setError(err.message || 'Unable to load members.')
      setMembers([])
    } finally {
      if (isActive()) setLoading(false)
    }
  }

  async function deleteMember(member) {
    if (!isAdmin) return

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.name} from the team?`
    )
    if (!confirmed) return

    setDeletingId(member.id)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)

      if (deleteError) throw deleteError
      setMembers((current) => current.filter((item) => item.id !== member.id))
      window.alert(`${member.name} has been removed from the team.`)
    } catch (err) {
      console.error('Delete member error:', err)
      setError(`Unable to delete member: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function handleImageError(event) {
    event.currentTarget.onerror = null
    event.currentTarget.src = teamLogo
  }

  if (loading) {
    return (
      <div className="members-page">
        <div className="members-header">
          <h1>ನಮ್ಮ ತಂಡದ ಸದಸ್ಯರು</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <h1>ನಮ್ಮ ತಂಡದ ಸದಸ್ಯರು</h1>
        <p>ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ</p>
      </div>

      {error && (
        <p role="alert" style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </p>
      )}

      {members.length === 0 && !error && (
        <p style={{ color: '#aaa', textAlign: 'center' }}>
          ಇನ್ನೂ ಯಾವುದೇ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.
        </p>
      )}

      <div
  className={`members-list ${
    canSeeDetails ? 'members-authorized' : 'members-visitor-gallery'
  }`}
>
        {members.map((member) => (
          <div
  className={`member-profile ${
    canSeeDetails ? 'member-details-card' : 'visitor-dp-item'
  }`}
  key={member.id}
>
            <img
              src={member.profile_image || teamLogo}
              alt={canSeeDetails ? (member.name || 'Team member') : 'Team member profile picture'}
              className="member-profile-image"
              onError={handleImageError}
            />

            {canSeeDetails && (
              <div className="member-info">
                <h2>{member.name}</h2>
                {member.role && <p className="member-role">{member.role}</p>}
                {member.phone && <p className="member-phone">📞 {member.phone}</p>}

                <div className="member-actions">
                  {member.phone && <a href={`tel:${member.phone}`}>📞 Call</a>}
                  {member.whatsapp && (
                    <a
                      href={`https://wa.me/91${String(member.whatsapp).replace(/\D/g, '').replace(/^91/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 WhatsApp
                    </a>
                  )}

                  {isAdmin && (
                    <>
                      <a href={`/edit-member/${member.id}`}>✏️ Edit</a>
                      <button
                        type="button"
                        onClick={() => deleteMember(member)}
                        disabled={deletingId === member.id}
                        style={{
                          background: deletingId === member.id ? '#555' : '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 6,
                          cursor: deletingId === member.id ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {deletingId === member.id ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Members
