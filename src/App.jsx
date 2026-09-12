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

  const [isAdmin, setIsAdmin] = useState(false)

  const navigate = useNavigate()


  useEffect(() => {

    checkAdmin()

  }, [])


  async function checkAdmin() {

    try {

      const {
        data: userData,
      } = await supabase.auth.getUser()


      if (!userData.user) {

        setIsAdmin(false)

        return
      }


      const { data } =
        await supabase
          .from('admins')
          .select('user_id')
          .eq(
            'user_id',
            userData.user.id
          )
          .maybeSingle()


      setIsAdmin(!!data)

    } catch (error) {

      console.error(
        'ADMIN CHECK ERROR:',
        error
      )

      setIsAdmin(false)

    }

  }


  async function handleLogout() {

    await supabase.auth.signOut()

    navigate('/login')

  }


  return (

    <div className="website">


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="navbar">

        <div className="nav-logo">

          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ (ರಿ)

        </div>


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


          <Link
            to="/admin"
            className="admin-nav-btn"
          >
            🔐 Admin Panel
          </Link>


          <button
            onClick={() =>
              navigate('/login')
            }
            className="login-btn"
          >
            Login
          </button>

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


        {/* INSTALL + NOTIFICATION */}

        <InstallAndNotification />


        {/* =====================================================
            TEAM LOGO
            CLICKING LOGO OPENS OFFICIAL YOUTUBE
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



        {/* SOCIAL LINKS */}

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


    const { error } =
      await supabase.auth.signInWithPassword({

        email,

        password,

      })


    if (error) {

      setError(error.message)

      setLoading(false)

      return

    }


    setLoading(false)


    navigate('/')

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
        !userData.user
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
          .from('admins')
          .select('user_id')
          .eq(
            'user_id',
            userData.user.id
          )
          .maybeSingle()



      if (error) {

        console.error(
          'Admin check error:',
          error
        )

        setIsAdmin(false)

      } else {

        setIsAdmin(!!data)

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
            GALLERY ADMIN
        ================================================= */}

        <Route
          path="/gallery-admin"
          element={

            <AdminRoute>

              <GalleryAdmin />

            </AdminRoute>

          }
        />



        {/* =================================================
            SEND NOTIFICATION
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