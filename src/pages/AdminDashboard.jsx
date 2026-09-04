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
    setError('')

    try {
      // Get logged-in admin
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        navigate('/login')
        return
      }

      setAdminEmail(userData.user.email || '')

      // Get total members
      const {
        count: members,
        error: memberError,
      } = await supabase
        .from('members')
        .select('*', {
          count: 'exact',
          head: true,
        })

      if (memberError) {
        throw memberError
      }

      setMemberCount(members || 0)

      // Get total gallery photos
      const {
        count: gallery,
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

      setGalleryCount(gallery || 0)

      // Get latest gallery photo
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

      if (latestError) {
        throw latestError
      }

      setLatestPhoto(
        latest && latest.length > 0
          ? latest[0]
          : null
      )

    } catch (error) {
      console.error(
        'Dashboard error:',
        error
      )

      setError(error.message)
    }

    setLoading(false)
    setRefreshing(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadDashboard()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function formatDate(date) {
    if (!date) return 'No uploads yet'

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <div className="admin-dashboard">

      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-header">

        <div>

          <p className="section-label">
            ADMIN PANEL
          </p>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
          </p>

        </div>

        <div className="admin-header-actions">

          <button
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={refreshing}
          >
            {refreshing
              ? '⟳ Refreshing...'
              : '🔄 Refresh'}
          </button>

          <button
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            🚪 Logout
          </button>

        </div>

      </div>


      {/* =========================
          ADMIN INFO
      ========================= */}

      <div className="admin-welcome-card">

        <div>

          <p className="section-label">
            LOGGED IN AS
          </p>

          <h2>
            👤 Administrator
          </h2>

          <p>
            {adminEmail || 'Loading...'}
          </p>

        </div>

        <div className="admin-status">
          <span className="status-dot"></span>
          Online
        </div>

      </div>


      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="dashboard-error">
          ⚠️ {error}
        </div>
      )}


      {/* =========================
          STATISTICS
      ========================= */}

      <div className="admin-stats">

        {/* Members */}

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>

            <h3>
              {loading
                ? '...'
                : memberCount}
            </h3>

            <p>
              Total Members
            </p>

          </div>

        </div>


        {/* Gallery */}

        <div className="stat-card">

          <div className="stat-icon">
            🖼️
          </div>

          <div>

            <h3>
              {loading
                ? '...'
                : galleryCount}
            </h3>

            <p>
              Gallery Photos
            </p>

          </div>

        </div>


        {/* System */}

        <div className="stat-card">

          <div className="stat-icon">
            🔐
          </div>

          <div>

            <h3>
              Secure
            </h3>

            <p>
              Admin System
            </p>

          </div>

        </div>

      </div>


      {/* =========================
          LATEST PHOTO
      ========================= */}

      <div className="dashboard-latest">

        <div className="dashboard-section-heading">

          <div>

            <p className="section-label">
              LATEST ACTIVITY
            </p>

            <h2>
              Latest Gallery Upload
            </h2>

          </div>

          <Link
            to="/gallery-admin"
            className="dashboard-view-link"
          >
            Manage Gallery →
          </Link>

        </div>


        {loading ? (

          <div className="latest-empty">
            Loading latest upload...
          </div>

        ) : latestPhoto ? (

          <div className="latest-photo-card">

            <img
              src={latestPhoto.image_url}
              alt={
                latestPhoto.title ||
                'Latest Gallery Photo'
              }
            />

            <div className="latest-photo-info">

              <p className="section-label">
                RECENT PHOTO
              </p>

              <h3>
                {latestPhoto.title ||
                  'Untitled Photo'}
              </h3>

              {latestPhoto.description && (
                <p>
                  {latestPhoto.description}
                </p>
              )}

              <span>
                📅 Uploaded on{' '}
                {formatDate(
                  latestPhoto.created_at
                )}
              </span>

            </div>

          </div>

        ) : (

          <div className="latest-empty">

            <div className="latest-empty-icon">
              📸
            </div>

            <h3>
              No gallery photos yet
            </h3>

            <p>
              Upload your first photo to see
              it here.
            </p>

            <Link
              to="/gallery-admin"
              className="primary-btn dashboard-upload-link"
            >
              📸 Upload Photo
            </Link>

          </div>

        )}

      </div>


      {/* =========================
          MANAGEMENT
      ========================= */}

      <div className="admin-section">

        <p className="section-label">
          MANAGEMENT
        </p>

        <h2>
          Website Management
        </h2>

        <div className="admin-cards">

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
                Add a new organization member
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>

          </Link>


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
                View and edit members
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>

          </Link>


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
                Upload and manage photos
              </p>
            </div>

            <span className="admin-card-link">
              →
            </span>

          </Link>


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