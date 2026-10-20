import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Bell, Images, ShieldCheck, LogIn, LogOut, House, Users, Phone } from 'lucide-react'
import teamLogo from '../assets/team-logo.jpg'

export default function Navbar({ isLoggedIn, isMember, isAdmin, onLogin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const navClass = ({ isActive }) => `royal-nav-link${isActive ? ' is-active' : ''}`

  return (
    <header className="royal-site-header">
      <nav className="royal-site-nav" aria-label="Main navigation">
        <Link to="/" className="royal-brand" onClick={closeMenu} aria-label="Netaji Boys home">
          <img src={teamLogo} alt="" className="royal-brand-logo" />
          <span className="royal-brand-copy">
            <strong>ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್</strong>
            <small>ಯುವಕರ ಸಂಘ (ರಿ) · ಮರಳಿಗ</small>
          </span>
        </Link>

        <button
          type="button"
          className="royal-menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="royal-navigation-links"
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div id="royal-navigation-links" className={`royal-nav-panel${menuOpen ? ' is-open' : ''}`}>
          <div className="royal-nav-links">
            <NavLink to="/" end className={navClass} onClick={closeMenu}><House size={16} /> <span>Home</span></NavLink>
            <NavLink to="/members" className={navClass} onClick={closeMenu}><Users size={16} /> <span>Members</span></NavLink>
            <NavLink to="/gallery" className={navClass} onClick={closeMenu}><Images size={16} /> <span>Gallery</span></NavLink>
            <a href="/#contact" className="royal-nav-link" onClick={closeMenu}><Phone size={16} /> <span>Contact</span></a>
            <NavLink to="/notifications" className={navClass} onClick={closeMenu} aria-label="Notifications"><Bell size={17} /><span className="royal-notification-label">Notifications</span></NavLink>
          </div>

          <div className="royal-nav-actions">
            {isLoggedIn && (isMember || isAdmin) && (
              <Link to="/gallery-admin" className="royal-nav-action" onClick={closeMenu}>
                <Images size={16} /> Upload
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="royal-nav-action royal-nav-admin" onClick={closeMenu}>
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
            {!isLoggedIn ? (
              <button type="button" className="royal-nav-login" onClick={() => { closeMenu(); onLogin() }}>
                <LogIn size={16} /> Login
              </button>
            ) : (
              <button type="button" className="royal-nav-login" onClick={() => { closeMenu(); onLogout() }}>
                <LogOut size={16} /> Logout
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
