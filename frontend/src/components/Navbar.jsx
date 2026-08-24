import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="surface border-bottom mb-4 sticky-top" style={{ borderRadius: 0 }}>
      <div className="container-fluid px-4 py-2 d-flex justify-content-between align-items-center">
        {/* Brand / Logo */}
        <div className="d-flex align-items-center gap-4">
          <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
            <span className="badge bg-primary px-2 py-1 rounded fs-6 fw-bold">AD</span>
            <span className="fw-bold fs-5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AdFlow
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="d-none d-md-flex align-items-center gap-1 ms-2">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/campaigns" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                Campaigns
              </NavLink>
              <NavLink 
                to="/spaces" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                Ad Spaces
              </NavLink>
            </nav>
          )}
        </div>

        {/* Right Controls */}
        <div className="d-flex align-items-center gap-3">
          {/* Light/Dark Mode Switch */}
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-2"
            title="Toggle theme"
          >
            <span>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
          </button>

          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block">
                <div className="fw-semibold small" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {user?.role}
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-danger rounded-2">
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-sm btn-outline-primary px-3">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-brand px-3">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;