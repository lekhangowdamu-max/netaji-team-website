import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminDashboard() {
  const navigate = useNavigate()

  const [memberCount, setMemberCount] = useState(0)
  const [galleryCount, setGalleryCount] = useState(0)
  const [latestPhoto, setLatestPhoto] = useState(null)

  const [adminEmail, setAdminEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setRefreshing(true)
      setError('')

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        navigate('/login')
        return
      }

      setAdminEmail(user.email || '')

      // Get member count
      const {
        count: membersCount,
        error: membersError,
      } = await supabase
        .from('members')
        .select('*', {
          count: 'exact',
          head: true,
        })

      if (membersError) {
        throw membersError
      }

      setMemberCount(membersCount || 0)

      // Get gallery count
      const {
        count: photosCount,
        error: galleryError,
      } = await supabase
        .from('gallery')
        .select('*', {
          count: 'exact',
          head: true,
        })

      if (galleryError) {
        throw galleryError
      }

      setGalleryCount(photosCount || 0)

      // Get latest gallery upload
      const {
        data: latest,
        error: latestError,
      } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (latestError) {
        throw latestError
      }

      setLatestPhoto(latest || null)
    } catch (error) {
      console.error(
        'DASHBOARD ERROR:',
        error
      )

      setError(
        error.message ||
        'Unable to load dashboard.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="admin-dashboard">

      {/* Header */}
      <div className="admin-header">

        <div>
          <p className="section-label">
            ADMIN PANEL
          </p>

          <h1>
            Dashboard
          </h1>

          <p>
            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            onClick={loadDashboard}
            className="refresh-btn"
            disabled={refreshing}
          >
            {refreshing
              ? 'Refreshing...'
              : '↻ Refresh'}
          </button>

          <button
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            Logout
          </button>

        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="admin-welcome-card">
          <h2>
            Loading dashboard...
          </h2>
        </div>
      )}

      {/* Admin Welcome */}
      {!loading && (
        <div className="admin-welcome-card">

          <p className="section-label">
            ADMIN ACCESS
          </p>

          <h2>
            Welcome, Admin 👋
          </h2>

          <p>
            You are logged in as:
          </p>

          <p>
            <strong>
              {adminEmail}
            </strong>
          </p>

          <div className="admin-status">
            <span className="status-dot"></span>
            Admin account active
          </div>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="dashboard-error">
          ⚠️ {error}
        </div>
      )}

      {/* Statistics */}
      <div className="admin-stats">

        <div className="stat-card">
          <div className="stat-icon">
            👥
          </div>

          <div>
            <p>
              Total Members
            </p>

            <h2>
              {memberCount}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            🖼️
          </div>

          <div>
            <p>
              Gallery Photos
            </p>

            <h2>
              {galleryCount}
            </h2>
          </div>
        </div>

      </div>

      {/* Latest Gallery */}
      <div className="dashboard-latest">

        <div className="dashboard-section-heading">

          <div>
            <p className="section-label">
              LATEST UPLOAD
            </p>

            <h2>
              Latest Gallery Photo
            </h2>
          </div>

          <Link
            to="/gallery"
            className="dashboard-view-link"
          >
            View Gallery →
          </Link>

        </div>

        {!latestPhoto ? (
          <div className="latest-empty">
            <p>
              No gallery photos uploaded yet.
            </p>
          </div>
        ) : (
          <div className="latest-photo-card">

            <img
              src={latestPhoto.image_url}
              alt={
                latestPhoto.title ||
                'Latest gallery photo'
              }
            />

            <div className="latest-photo-info">

              <h3>
                {latestPhoto.title ||
                  'Untitled Photo'}
              </h3>

              {latestPhoto.description && (
                <p>
                  {latestPhoto.description}
                </p>
              )}

              <small>
                Uploaded on{' '}
                {new Date(
                  latestPhoto.created_at
                ).toLocaleDateString()}
              </small>

            </div>

          </div>
        )}

      </div>

      {/* Management */}
      <div className="admin-section">

        <p className="section-label">
          MANAGEMENT
        </p>

        <h2>
          Website Management
        </h2>

        <div className="admin-cards">

          {/* Add Member */}
          <Link
            to="/add-member"
            className="admin-card"
          >
            <div className="admin-card-icon">
              ➕
            </div>

            <div>
              <h3>
                Add Member
              </h3>

              <p>
                Add a new team member
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>
          </Link>

          {/* Manage Members */}
          <Link
            to="/members"
            className="admin-card"
          >
            <div className="admin-card-icon">
              👥
            </div>

            <div>
              <h3>
                Manage Members
              </h3>

              <p>
                View and manage team members
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>
          </Link>

          {/* Notification Center */}
          <Link
            to="/send-notification"
            className="admin-card"
          >
            <div className="admin-card-icon">
              🔔
            </div>

            <div>
              <h3>
                Notification Center
              </h3>

              <p>
                Send updates to team members
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>
          </Link>

          {/* Gallery Management */}
          <Link
            to="/gallery-admin"
            className="admin-card"
          >
            <div className="admin-card-icon">
              🖼️
            </div>

            <div>
              <h3>
                Gallery Management
              </h3>

              <p>
                Upload and manage gallery photos
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>
          </Link>

          {/* View Website */}
          <Link
            to="/"
            className="admin-card"
          >
            <div className="admin-card-icon">
              🌐
            </div>

            <div>
              <h3>
                View Website
              </h3>

              <p>
                Open the public website
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>
          </Link>

        </div>

      </div>

    </div>
  )
}

export default AdminDashboard