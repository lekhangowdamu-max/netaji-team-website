import Notifications from './pages/Notifications'
import InstallAndNotification from './components/InstallAndNotification'

import { useState, useEffect } from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from 'react-router-dom'

import './App.css'

import teamLogo from './assets/team-logo.jpg'

import Members from './pages/Members'
import Gallery from './pages/Gallery'
import AddMember from './pages/AddMember'
import EditMember from './pages/EditMember'
import AdminDashboard from './pages/AdminDashboard'
import GalleryAdmin from './pages/GalleryAdmin'
import NotificationTest from './pages/NotificationTest'
import SendNotification from './pages/SendNotification'

import { supabase } from './lib/supabase'


/* =====================================================
   OFFICIAL LINKS
===================================================== */

const YOUTUBE_URL =
  'https://youtube.com/@nsbsboys'

const INSTAGRAM_URL =
  'https://www.instagram.com/netaji_boys_maraliga/'


/* =====================================================
   HOME PAGE
===================================================== */

function Home() {

  const navigate = useNavigate()

  const [user, setUser] =
    useState(null)

  const [userRole, setUserRole] =
    useState('')

  const [loadingUser, setLoadingUser] =
    useState(true)


  /* =====================================================
     CHECK LOGIN + ROLE
  ===================================================== */

  useEffect(() => {

    loadUser()

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {

          if (!session?.user) {

            setUser(null)
            setUserRole('')
            setLoadingUser(false)

            return
          }

          setUser(session.user)

          await loadUserRole(
            session.user.id
          )

        }
      )


    return () => {

      authListener.subscription.unsubscribe()

    }

  }, [])


  /* =====================================================
     LOAD CURRENT USER
  ===================================================== */

  async function loadUser() {

    try {

      const {
        data,
        error,
      } =
        await supabase.auth.getUser()


      if (
        error ||
        !data?.user
      ) {

        setUser(null)
        setUserRole('')
        setLoadingUser(false)

        return

      }


      setUser(data.user)

      await loadUserRole(
        data.user.id
      )

    } catch (error) {

      console.error(
        'USER LOAD ERROR:',
        error
      )

      setUser(null)
      setUserRole('')

    }

    setLoadingUser(false)

  }


  /* =====================================================
     LOAD USER ROLE
  ===================================================== */

  async function loadUserRole(userId) {

    try {

      const {
        data,
        error,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            userId
          )
          .maybeSingle()


      if (error) {

        console.error(
          'ROLE LOAD ERROR:',
          error
        )

        setUserRole('')

        return

      }


      setUserRole(
        data?.role || ''
      )

    } catch (error) {

      console.error(
        'ROLE CHECK ERROR:',
        error
      )

      setUserRole('')

    }

  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  async function handleLogout() {

    try {

      await supabase.auth.signOut()

      setUser(null)
      setUserRole('')

      navigate('/')

    } catch (error) {

      console.error(
        'LOGOUT ERROR:',
        error
      )

    }

  }


  const isLoggedIn =
    !!user

  const isAdmin =
    userRole === 'admin'

  const isMember =
    userRole === 'member'


  return (

    <div className="website">


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="navbar">


        {/* =================================================
            LOGO / TEAM NAME
        ================================================= */}

        <div className="nav-logo">

          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ (ರಿ)

        </div>


        {/* =================================================
            NAVIGATION LINKS
        ================================================= */}

        <div className="nav-links">


          <Link to="/">
            Home
          </Link>


          <Link to="/members">
            Members
          </Link>


          <Link to="/gallery">
            Gallery
          </Link>


          <a href="#contact">
            Contact
          </a>


          <Link to="/notifications">
            🔔
          </Link>


          {/* =================================================
              MEMBER + ADMIN GALLERY UPLOAD
          ================================================= */}

          {isLoggedIn &&
            (isMember || isAdmin) && (

              <Link
                to="/gallery-admin"
                className="admin-nav-btn"
              >
                📸 Upload
              </Link>

            )}


          {/* =================================================
              ADMIN PANEL
          ================================================= */}

          {isAdmin && (

            <Link
              to="/admin"
              className="admin-nav-btn"
            >
              🔐 Admin Panel
            </Link>

          )}


          {/* =================================================
              LOGIN / LOGOUT
          ================================================= */}

          {!isLoggedIn && (

            <button
              onClick={() =>
                navigate('/login')
              }
              className="login-btn"
            >
              Login
            </button>

          )}


          {isLoggedIn && (

            <button
              onClick={handleLogout}
              className="login-btn"
            >
              Logout
            </button>

          )}

        </div>

      </nav>



      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        id="home"
        className="hero-section"
      >


        <div className="hero-content">


          <p className="small-title">
            ಮರಳಿಗ
          </p>


          <h1>

            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್

            <br />

            ಯುವಕರ ಸಂಘ(ರಿ).

          </h1>


          <p className="hero-description">

            ನಮ್ಮ ಯುವಕರ ಒಗ್ಗಟ್ಟು, ಸೇವೆ ಮತ್ತು
            ಸಂಸ್ಕೃತಿಯ ಪ್ರತೀಕ.

            <br />

            Netaji Maraliga • Netaji Boys Maraliga

          </p>


          <div className="hero-buttons">


            <Link
              to="/members"
              className="primary-btn"
            >
              ನಮ್ಮ ತಂಡ
            </Link>


            <Link
              to="/gallery"
              className="secondary-btn"
            >
              ಫೋಟೋ ಗ್ಯಾಲರಿ
            </Link>


          </div>


        </div>



        {/* =====================================================
            INSTALL + NOTIFICATION
        ===================================================== */}

        <InstallAndNotification />



        {/* =====================================================
            TEAM LOGO
            CLICK → OFFICIAL YOUTUBE
        ===================================================== */}

        <div className="hero-logo">

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Official YouTube Channel"
          >

            <img
              src={teamLogo}
              alt="ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ - Official YouTube Channel"
            />

          </a>

        </div>

      </section>



      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section className="about-section">

        <p className="section-label">
          ABOUT US
        </p>


        <h2>
          ನಮ್ಮ ಸಂಘದ ಬಗ್ಗೆ
        </h2>


        <p>

          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘವು
          ಯುವಕರ ಒಗ್ಗಟ್ಟು, ಸಮಾಜ ಸೇವೆ, ಸಂಸ್ಕೃತಿ
          ಮತ್ತು ನಮ್ಮ ಗ್ರಾಮದ ಅಭಿವೃದ್ಧಿಗಾಗಿ
          ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಯುವಕರ ಸಂಘವಾಗಿದೆ.

        </p>

      </section>


      {/* =====================================================
          SEO / ORGANIZATION INFORMATION
          Helps search engines understand the English names
          associated with the official Kannada organization.
      ===================================================== */}

      <section
        className="about-section seo-section"
        aria-labelledby="netaji-maraliga-title"
      >

        <p className="section-label">
          NETAJI MARALIGA
        </p>

        <h2 id="netaji-maraliga-title">
          Netaji Maraliga – Official Website
        </h2>

        <p>
          Netaji Maraliga is the official website of
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ, ಮರಳಿಗ.
          The organization is also known as Netaji Boys Maraliga
          and Nethaji Boys Maraliga.
        </p>

        <p>
          This official website provides information about our
          team members, community activities, Ganeshotsava
          celebrations, events, photos, videos and social
          activities in Maraliga.
        </p>

      </section>



      {/* =====================================================
          MEMBERS
      ===================================================== */}

      <section className="members-section">

        <p className="section-label">
          OUR TEAM
        </p>


        <h2>
          ನಮ್ಮ ತಂಡ
        </h2>


        <p
          style={{
            color: '#aaa',
            marginBottom: '25px',
          }}
        >

          ನಮ್ಮ ಸಂಘದ ಎಲ್ಲಾ ಸದಸ್ಯರನ್ನು ನೋಡಲು
          ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.

        </p>


        <Link
          to="/members"
          className="primary-btn"
        >
          ಎಲ್ಲಾ ಸದಸ್ಯರನ್ನು ನೋಡಿ
        </Link>

      </section>



      {/* =====================================================
          MEMBER UPLOAD INFORMATION
      ===================================================== */}

      {isLoggedIn &&
        (isMember || isAdmin) && (

          <section
            className="about-section"
          >

            <p className="section-label">
              GALLERY
            </p>


            <h2>
              📸 ಫೋಟೋ ಮತ್ತು ವಿಡಿಯೋ
            </h2>


            <p
              style={{
                color: '#aaa',
                marginBottom: '25px',
              }}
            >

              {isAdmin
                ? 'ನೀವು Gallery ಅನ್ನು ನಿರ್ವಹಿಸಬಹುದು.'
                : 'ನೀವು ಸಂಘದ Gallery ಗೆ ಫೋಟೋ ಮತ್ತು ವಿಡಿಯೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.'
              }

            </p>


            <Link
              to="/gallery-admin"
              className="primary-btn"
            >
              📸 Upload Photo / Video
            </Link>

          </section>

        )}



      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        id="contact"
        className="contact-section"
      >


        <p className="section-label">
          CONTACT
        </p>


        <h2>
          ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ
        </h2>


        <p>
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </p>


        <p>
          📍 ಮರಳಿಗ
        </p>



        {/* =================================================
            SOCIAL LINKS
        ================================================= */}

        <div className="social-links">


          {/* =================================================
              YOUTUBE
          ================================================= */}

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Official YouTube Channel"
          >

            <img
              src="/youtube.png"
              alt="Official YouTube Channel"
              className="social-logo"
            />

          </a>



          {/* =================================================
              INSTAGRAM
          ================================================= */}

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Official Instagram"
          >

            <img
              src="/instagram.png"
              alt="Official Instagram"
              className="social-logo"
            />

          </a>


        </div>

      </section>



      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>

        <h3>
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </h3>


        <p>
          ಮರಳಿಗ
        </p>


        <p>
          © 2026 All Rights Reserved.
        </p>

      </footer>


    </div>

  )

}



/* =====================================================
   LOGIN PAGE
===================================================== */

function Login() {

  const navigate = useNavigate()


  const [email, setEmail] =
    useState('')


  const [password, setPassword] =
    useState('')


  const [loading, setLoading] =
    useState(false)


  const [error, setError] =
    useState('')



  async function handleLogin(e) {

    e.preventDefault()


    setLoading(true)

    setError('')


    try {

      const {
        error
      } =
        await supabase.auth.signInWithPassword({

          email,

          password,

        })


      if (error) {

        setError(
          error.message
        )

        setLoading(false)

        return

      }


      navigate('/')

    } catch (error) {

      console.error(
        'LOGIN ERROR:',
        error
      )

      setError(
        'Unable to login. Please try again.'
      )

    }


    setLoading(false)

  }



  return (

    <div className="website">

      <section
        className="about-section login-section"
      >


        <p className="section-label">
          MEMBER ACCESS
        </p>


        <h2>
          Login
        </h2>


        <p
          style={{
            color: '#aaa',
            marginBottom: '25px',
          }}
        >

          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ

        </p>



        <form
          onSubmit={handleLogin}
          className="login-form"
        >


          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />


          {error && (

            <p
              style={{
                color: '#ff6b6b',
              }}
            >
              {error}
            </p>

          )}


          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >

            {loading
              ? 'Logging in...'
              : 'Login'}

          </button>


        </form>


        <br />


        <Link
          to="/"
          className="secondary-btn"
        >
          Back to Home
        </Link>


      </section>

    </div>

  )

}



/* =====================================================
   ADMIN ROUTE
   ONLY ADMIN
===================================================== */

function AdminRoute({ children }) {

  const [checking, setChecking] =
    useState(true)


  const [isAdmin, setIsAdmin] =
    useState(false)



  useEffect(() => {

    checkAdmin()

  }, [])



  async function checkAdmin() {

    try {

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser()


      if (
        userError ||
        !userData?.user
      ) {

        setIsAdmin(false)

        setChecking(false)

        return

      }



      const {
        data,
        error,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            userData.user.id
          )
          .maybeSingle()



      if (error) {

        console.error(
          'ADMIN ROLE CHECK ERROR:',
          error
        )

        setIsAdmin(false)

      } else {

        setIsAdmin(
          data?.role === 'admin'
        )

      }


    } catch (error) {

      console.error(
        'ADMIN ROUTE ERROR:',
        error
      )

      setIsAdmin(false)

    }


    setChecking(false)

  }



  if (checking) {

    return (

      <div className="website">

        <section className="about-section">

          <h2>
            Checking admin access...
          </h2>

        </section>

      </div>

    )

  }



  if (!isAdmin) {

    return (

      <Navigate
        to="/login"
        replace
      />

    )

  }



  return children

}



/* =====================================================
   GALLERY ACCESS ROUTE
   ADMIN + MEMBER
===================================================== */

function GalleryAccessRoute({
  children,
}) {

  const [checking, setChecking] =
    useState(true)


  const [hasAccess, setHasAccess] =
    useState(false)



  useEffect(() => {

    checkGalleryAccess()

  }, [])



  async function checkGalleryAccess() {

    try {

      /* =================================================
         GET LOGGED-IN USER
      ================================================= */

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser()


      if (
        userError ||
        !userData?.user
      ) {

        setHasAccess(false)

        setChecking(false)

        return

      }



      /* =================================================
         GET ROLE
      ================================================= */

      const {
        data,
        error,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            userData.user.id
          )
          .maybeSingle()



      if (error) {

        console.error(
          'GALLERY ACCESS ERROR:',
          error
        )

        setHasAccess(false)

      } else {

        const role =
          data?.role


        /* ===============================================
           ADMIN OR MEMBER
        =============================================== */

        setHasAccess(
          role === 'admin' ||
          role === 'member'
        )

      }


    } catch (error) {

      console.error(
        'GALLERY ACCESS ROUTE ERROR:',
        error
      )

      setHasAccess(false)

    }


    setChecking(false)

  }



  if (checking) {

    return (

      <div className="website">

        <section className="about-section">

          <h2>
            Checking gallery access...
          </h2>

        </section>

      </div>

    )

  }



  if (!hasAccess) {

    return (

      <Navigate
        to="/login"
        replace
      />

    )

  }



  return children

}



/* =====================================================
   APP
===================================================== */

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* =================================================
            NOTIFICATION TEST
        ================================================= */}

        <Route
          path="/notification-test"
          element={
            <NotificationTest />
          }
        />



        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <Route
          path="/notifications"
          element={
            <Notifications />
          }
        />



        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/"
          element={
            <Home />
          }
        />



        {/* =================================================
            ADMIN DASHBOARD
            ADMIN ONLY
        ================================================= */}

        <Route
          path="/admin"
          element={

            <AdminRoute>

              <AdminDashboard />

            </AdminRoute>

          }
        />



        {/* =================================================
            MEMBERS
        ================================================= */}

        <Route
          path="/members"
          element={
            <Members />
          }
        />



        {/* =================================================
            GALLERY
            PUBLIC
        ================================================= */}

        <Route
          path="/gallery"
          element={
            <Gallery />
          }
        />



        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />



        {/* =================================================
            ADD MEMBER
            ADMIN ONLY
        ================================================= */}

        <Route
          path="/add-member"
          element={

            <AdminRoute>

              <AddMember />

            </AdminRoute>

          }
        />



        {/* =================================================
            EDIT MEMBER
            ADMIN ONLY
        ================================================= */}

        <Route
          path="/edit-member/:id"
          element={

            <AdminRoute>

              <EditMember />

            </AdminRoute>

          }
        />



        {/* =================================================
            GALLERY ADMIN / UPLOAD
            ADMIN + MEMBER
        ================================================= */}

        <Route
          path="/gallery-admin"
          element={

            <GalleryAccessRoute>

              <GalleryAdmin />

            </GalleryAccessRoute>

          }
        />



        {/* =================================================
            SEND NOTIFICATION
            ADMIN ONLY
        ================================================= */}

        <Route
          path="/send-notification"
          element={

            <AdminRoute>

              <SendNotification />

            </AdminRoute>

          }
        />


      </Routes>

    </BrowserRouter>

  )

}


export default App