import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import '../styles/landing.css';

export const PublicNavbar = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  return (
    <header className="landing-navbar">
      <Link to="/" className="landing-navbar__brand">
        <div className="landing-navbar__logo-box">AD</div>
        <span>AdFlow</span>
      </Link>

      <nav className="landing-navbar__nav">
        <a href="/#features" className="landing-navbar__link">Features</a>
        <a href="/#inventory" className="landing-navbar__link">Billboard Inventory</a>
        <a href="/#how-it-works" className="landing-navbar__link">How It Works</a>
        <a href="/#calculator" className="landing-navbar__link">ROI Estimator</a>
      </nav>

      <div className="landing-navbar__actions">
        <button
          type="button"
          className="landing-navbar__theme-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {user ? (
          <Link to="/dashboard" className="landing-navbar__cta-btn">
            <span>Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            {!isLoginPage && (
              <Link to="/login" className="landing-navbar__login-btn">
                Sign In
              </Link>
            )}
            {!isRegisterPage ? (
              <Link to="/register" className="landing-navbar__cta-btn">
                <span>Start Campaign</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link to="/login" className="landing-navbar__cta-btn">
                <span>Sign In</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default PublicNavbar;
