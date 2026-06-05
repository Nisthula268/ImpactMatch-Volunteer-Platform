import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : '';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const dropRef = useRef(null);

  const handleLogout = () => {
    setUserDropOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setUserDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setUserDropOpen(false);
  }, [location.pathname]);

  const navLinks = {
    volunteer: [
      { to: '/dashboard',     label: 'Dashboard' },
      { to: '/opportunities', label: 'Find Opportunities' },
      { to: '/applications',  label: 'My Applications' },
      { to: '/mentorship',    label: 'Mentorship' },
      { to: '/certificates',  label: 'Certificates' },
    ],
    organization: [
      { to: '/dashboard',        label: 'Dashboard' },
      { to: '/post-opportunity', label: 'Post Opportunity' },
      { to: '/my-opportunities', label: 'My Listings' },
      { to: '/certificates',     label: 'Certificates' },
    ],
    mentor: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/mentor',    label: 'Mentor Panel' },
    ],
  };

  const links = user ? (navLinks[user.role] || []) : [];
  const isActive = (to) =>
    location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(to + '/'));

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Brand */}
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>🌱</span>
          <span style={styles.brandText}>ImpactMatch</span>
        </Link>

        {/* Main nav links */}
        <div style={styles.links}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ ...styles.link, ...(isActive(to) ? styles.activeLink : {}) }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={styles.right}>
          {user ? (
            /* User dropdown */
            <div ref={dropRef} style={styles.dropWrap}>
              <button
                onClick={() => setUserDropOpen(!userDropOpen)}
                style={styles.userBtn}
                aria-expanded={userDropOpen}
              >
                {user.profilePicture ? (
                  <img
                    src={`${API_BASE}${user.profilePicture}`}
                    alt="avatar"
                    style={styles.avatarImg}
                  />
                ) : (
                  <span style={styles.avatarCircle}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
                <span style={styles.userName}>{user.name}</span>
                <span style={styles.roleTag}>{user.role}</span>
                <span style={styles.chevron}>{userDropOpen ? '▲' : '▼'}</span>
              </button>

              {userDropOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropHeader}>
                    <div style={styles.dropName}>{user.name}</div>
                    <div style={styles.dropEmail}>{user.email}</div>
                  </div>
                  <div style={styles.dropDivider} />
                  <Link to="/profile"   style={styles.dropItem}>👤 My Profile</Link>
                  <Link to="/dashboard" style={styles.dropItem}>📊 Dashboard</Link>
                  <div style={styles.dropDivider} />
                  <button onClick={handleLogout} style={styles.dropLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    style={styles.link}>Login</Link>
              <Link to="/register" style={styles.ctaBtn}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          style={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && user && (
        <div style={styles.mobileDrawer}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ ...styles.mobileLink, ...(isActive(to) ? styles.mobileLinkActive : {}) }}
            >
              {label}
            </Link>
          ))}
          <div style={styles.mobileDivider} />
          <Link to="/profile" style={styles.mobileLink}>👤 My Profile</Link>
          <button onClick={handleLogout} style={styles.mobileLogout}>🚪 Sign Out</button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    background: '#1e40af', color: '#fff', padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  container: {
    maxWidth: 1200, margin: '0 auto', display: 'flex',
    alignItems: 'center', height: 64, gap: 16,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 8,
    textDecoration: 'none', color: '#fff', flexShrink: 0,
  },
  brandIcon: { fontSize: 24 },
  brandText:  { fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' },
  links: {
    display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap', alignItems: 'center',
  },
  link: {
    color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
    padding: '6px 11px', borderRadius: 6, fontSize: 13,
    transition: 'background 0.15s', whiteSpace: 'nowrap',
  },
  activeLink: { background: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 },
  right: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginLeft: 'auto', flexShrink: 0,
  },
  ctaBtn: {
    background: '#10b981', color: '#fff', padding: '7px 16px',
    borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 600,
  },

  /* User button */
  dropWrap: { position: 'relative' },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, padding: '5px 12px',
    cursor: 'pointer', color: '#fff',
  },
  avatarImg: {
    width: 28, height: 28, borderRadius: '50%',
    objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.3)',
  },
  avatarCircle: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: {
    fontSize: 13, fontWeight: 500, color: '#fff',
    maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  roleTag: {
    background: 'rgba(255,255,255,0.15)', fontSize: 10,
    padding: '2px 7px', borderRadius: 20,
    textTransform: 'uppercase', letterSpacing: 0.8, color: '#bfdbfe',
  },
  chevron: { fontSize: 9, color: 'rgba(255,255,255,0.55)', marginLeft: 2 },

  /* Dropdown panel */
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#fff', borderRadius: 12, minWidth: 220,
    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
    border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 200,
  },
  dropHeader:  { padding: '14px 18px', background: '#f8fafc' },
  dropName:    { fontSize: 14, fontWeight: 700, color: '#1e3a5f' },
  dropEmail:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  dropDivider: { height: 1, background: '#f3f4f6', margin: '4px 0' },
  dropItem: {
    display: 'block', padding: '10px 18px', fontSize: 14,
    color: '#374151', textDecoration: 'none',
  },
  dropLogout: {
    display: 'block', width: '100%', padding: '10px 18px',
    fontSize: 14, color: '#ef4444', background: 'none',
    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
  },

  /* Mobile hamburger */
  hamburger: {
    display: 'none', background: 'none', border: 'none',
    color: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0,
    marginLeft: 8,
  },

  /* Mobile drawer */
  mobileDrawer: {
    display: 'flex', flexDirection: 'column',
    background: '#1e3a8a', padding: '8px 16px 16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  mobileLink: {
    color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
    padding: '10px 8px', fontSize: 15, borderRadius: 6,
  },
  mobileLinkActive: { color: '#fff', fontWeight: 600, background: 'rgba(255,255,255,0.1)' },
  mobileDivider: { height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' },
  mobileLogout: {
    color: '#fca5a5', background: 'none', border: 'none',
    padding: '10px 8px', fontSize: 15, cursor: 'pointer',
    textAlign: 'left', fontFamily: 'inherit',
  },
};

export default Navbar;
