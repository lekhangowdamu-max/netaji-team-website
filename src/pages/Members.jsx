
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import teamLogo from '../assets/team-logo.jpg'
import '../styles/members-premium.css'

const PAGE_SIZE = 12

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function whatsappUrl(value) {
  const digits = normalizePhone(value)
  if (!digits) return ''

  // Stored Indian 10-digit numbers get country code 91.
  const normalized =
    digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '')

  return `https://wa.me/${normalized}`
}

function MemberSkeleton({ visitor = false }) {
  return (
    <div
      className={`member-profile ${
        visitor ? 'visitor-dp-item' : 'member-details-card'
      } member-skeleton`}
      aria-hidden="true"
    >
      <div className="member-image-frame skeleton-block" />

      {!visitor && (
        <div className="member-info">
          <div className="skeleton-line skeleton-line-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line-short" />
          <div className="skeleton-actions">
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  )
}

function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessRole, setAccessRole] = useState('visitor')
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [view, setView] = useState('grid')

  const canSeeDetails =
    accessRole === 'admin' || accessRole === 'member'

  const isAdmin = accessRole === 'admin'

  const loadMembers = useCallback(async (isActive = () => true) => {
    if (!isActive()) return

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      // A missing session is expected for public visitors.
      if (
        authError &&
        authError.name !== 'AuthSessionMissingError'
      ) {
        throw authError
      }

      let role = 'visitor'

      if (user) {
        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) throw profileError

        if (
          profile?.role === 'admin' ||
          profile?.role === 'member'
        ) {
          role = profile.role
        }
      }

      if (!isActive()) return

      setAccessRole(role)

      // Visitors receive only the public image fields.
      const query =
        role === 'visitor'
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
    } catch (err) {
      console.error('Error loading members:', err)

      if (!isActive()) return

      setError(
        err?.message || 'Unable to load members. Please try again.'
      )
      setMembers([])
    } finally {
      if (isActive()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const isActive = () => active

    loadMembers(isActive)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Defer refresh to avoid holding up the Supabase auth lock.
      Promise.resolve().then(() => {
        if (active) loadMembers(isActive)
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadMembers])

  async function deleteMember(member) {
    if (!isAdmin || deletingId) return

    const confirmed = window.confirm(
      `Are you sure you want to remove ${
        member.name || 'this member'
      } from the team?`
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

      setMembers((current) =>
        current.filter((item) => item.id !== member.id)
      )
    } catch (err) {
      console.error('Delete member error:', err)

      setError(
        `Unable to delete member: ${
          err?.message || 'Please try again.'
        }`
      )
    } finally {
      setDeletingId(null)
    }
  }

  const roleOptions = useMemo(() => {
    if (!canSeeDetails) return []

    return [
      ...new Set(
        members.map((member) => member.role).filter(Boolean)
      ),
    ].sort((a, b) => String(a).localeCompare(String(b)))
  }, [members, canSeeDetails])

  const filteredMembers = useMemo(() => {
    if (!canSeeDetails) return members

    const term = search.trim().toLocaleLowerCase()

    return members.filter((member) => {
      const matchesSearch =
        !term ||
        [member.name, member.role, member.phone].some((value) =>
          String(value || '').toLocaleLowerCase().includes(term)
        )

      const matchesRole =
        roleFilter === 'all' || member.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [members, canSeeDetails, search, roleFilter])

  function handleImageError(event) {
    event.currentTarget.onerror = null
    event.currentTarget.src = teamLogo
  }

  return (
    <main className="members-page">
      <div
        className="members-ambient ambient-one"
        aria-hidden="true"
      />
      <div
        className="members-ambient ambient-two"
        aria-hidden="true"
      />

      <header className="members-hero">
        <div className="members-eyebrow">
          <span className="eyebrow-line" />
          OUR COMMUNITY
          <span className="eyebrow-line" />
        </div>

        <h1>
          ನಮ್ಮ ತಂಡದ <span>ಸದಸ್ಯರು</span>
        </h1>

        <p className="members-subtitle">
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </p>

        <div
          className="members-hero-divider"
          aria-hidden="true"
        >
          <span />
          <span className="divider-diamond">✦</span>
          <span />
        </div>

        <p className="members-tagline">
          UNITY · SERVICE · TRADITION
        </p>

        {/* Only authorized members see directory statistics. */}
        {canSeeDetails && !loading && !error && (
          <div
            className="members-stats"
            aria-label="Member statistics"
          >
            <div className="member-stat">
              <span className="stat-number">
                {members.length}
              </span>
              <span className="stat-label">TEAM MEMBERS</span>
            </div>

            <span className="stat-separator" />

            <div className="member-stat">
              <span className="stat-number">
                {roleOptions.length}
              </span>
              <span className="stat-label">TEAM ROLES</span>
            </div>
          </div>
        )}
      </header>

      {canSeeDetails && (
        <section
          className="members-toolbar"
          aria-label="Member directory controls"
        >
          <div className="members-toolbar-title">
            <span className="toolbar-kicker">THE DIRECTORY</span>
            <h2>Meet Our Members</h2>

            <p className="members-result-count">
              {loading
                ? 'Loading directory…'
                : `${filteredMembers.length} of ${members.length} members`}
            </p>
          </div>

          <div className="members-controls">
            <label className="members-search">
              <span aria-hidden="true">⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, role, phone…"
                aria-label="Search members"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>

            <label className="members-filter-label">
              <span className="sr-only">Filter by role</span>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                aria-label="Filter by role"
              >
                <option value="all">All roles</option>

                {roleOptions.map((role) => (
                  <option value={role} key={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div
              className="members-view-toggle"
              role="group"
              aria-label="Choose member layout"
            >
              <button
                type="button"
                className={view === 'grid' ? 'active' : ''}
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                title="Grid view"
              >
                ▦
              </button>

              <button
                type="button"
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                title="List view"
              >
                ☷
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Do not show directory errors to public visitors. */}
      {canSeeDetails && error && (
        <div className="members-error" role="alert">
          <span>!</span>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadMembers()}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div
          className={`members-list ${
            canSeeDetails
              ? 'members-authorized'
              : 'members-visitor-gallery'
          }`}
          aria-label="Loading members"
        >
          {Array.from(
            { length: canSeeDetails ? 6 : 9 },
            (_, index) => (
              <MemberSkeleton
                key={index}
                visitor={!canSeeDetails}
              />
            )
          )}
        </div>
      ) : !canSeeDetails ? (
        // Public gallery: show profile pictures only.
        <div
          className="members-list members-visitor-gallery"
          aria-label="Member profile pictures"
        >
          {filteredMembers.map((member, index) => (
            <article
              className="member-profile visitor-dp-item"
              key={member.id}
              style={{
                '--card-index': Math.min(index, 12),
              }}
            >
              <div className="member-image-frame">
                <img
                  src={member.profile_image || teamLogo}
                  alt="Team member profile picture"
                  className="member-profile-image"
                  loading={index < 4 ? 'eager' : 'lazy'}
                  onError={handleImageError}
                />
              </div>
            </article>
          ))}
        </div>
      ) : filteredMembers.length === 0 && !error ? (
        <section className="members-empty">
          <div className="empty-emblem" aria-hidden="true">
            ✦
          </div>

          <h2>
            {members.length
              ? 'No matching members'
              : 'ನಮ್ಮ ಸದಸ್ಯರು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಾರೆ'}
          </h2>

          <p>
            {members.length
              ? 'Try another name or role, or clear your search.'
              : 'There are no member profiles to display yet.'}
          </p>

          {members.length > 0 && (
            <button
              type="button"
              className="member-action member-edit"
              onClick={() => {
                setSearch('')
                setRoleFilter('all')
              }}
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <div
          className={`members-list members-authorized ${
            view === 'list' ? 'members-list-view' : ''
          }`}
        >
          {filteredMembers.map((member, index) => (
            <article
              className="member-profile member-details-card"
              key={member.id}
              style={{
                '--card-index': Math.min(index, 12),
              }}
            >
              <div className="member-image-frame">
                <img
                  src={member.profile_image || teamLogo}
                  alt={`${member.name || 'Team'} profile`}
                  className="member-profile-image"
                  loading={index < 4 ? 'eager' : 'lazy'}
                  onError={handleImageError}
                />

                <span
                  className="member-image-shine"
                  aria-hidden="true"
                />
              </div>

              <div className="member-info">
                <span className="member-card-label">
                  TEAM MEMBER
                </span>

                <h2>{member.name || 'Team Member'}</h2>

                {member.role && (
                  <p className="member-role">{member.role}</p>
                )}

                {member.phone && (
                  <p className="member-phone">
                    <span aria-hidden="true">☎</span>{' '}
                    {member.phone}
                  </p>
                )}

                <div className="member-actions">
                  {member.phone && (
                    <a
                      className="member-action member-call"
                      href={`tel:${member.phone}`}
                    >
                      ☎ Call
                    </a>
                  )}

                  {member.whatsapp && (
                    <a
                      className="member-action member-whatsapp"
                      href={whatsappUrl(member.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ◉ WhatsApp
                    </a>
                  )}

                  {isAdmin && (
                    <div className="member-admin-actions">
                      <Link
                        className="member-action member-edit"
                        to={`/edit-member/${member.id}`}
                      >
                        ✎ Edit profile
                      </Link>

                      <button
                        className="member-action member-delete"
                        type="button"
                        onClick={() => deleteMember(member)}
                        disabled={deletingId === member.id}
                      >
                        {deletingId === member.id
                          ? 'Deleting…'
                          : '⌫ Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {canSeeDetails &&
        !loading &&
        !error &&
        filteredMembers.length > 0 && (
          <footer className="members-footer">
            <span>✦</span>
            {' '}ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ{' '}
            <span>✦</span>
          </footer>
        )}
    </main>
  )
}

export default Members
