import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../features/notifications/components/NotificationBell';
import { 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard, 
  Megaphone, 
  MapPin, 
  CalendarDays, 
  Layers, 
  Image as ImageIcon, 
  CreditCard 
} from 'lucide-react';

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
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink 
                to="/campaigns" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <Megaphone size={16} />
                <span>Campaigns</span>
              </NavLink>
              <NavLink 
                to="/spaces" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <MapPin size={16} />
                <span>Ad Spaces</span>
              </NavLink>
              <NavLink 
                to="/availability" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <CalendarDays size={16} />
                <span>Availability</span>
              </NavLink>
              <NavLink 
                to="/bookings" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <Layers size={16} />
                <span>Bookings</span>
              </NavLink>
              <NavLink 
                to="/creatives" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <ImageIcon size={16} />
                <span>Creatives</span>
              </NavLink>
              <NavLink 
                to="/payments" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                    isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                  }`
                }
              >
                <CreditCard size={16} />
                <span>Billing</span>
              </NavLink>
              {user?.role === 'Administrator' && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-2 text-decoration-none fw-medium text-sm d-flex align-items-center gap-1.5 ${
                      isActive ? 'text-primary bg-primary-subtle' : 'text-secondary'
                    }`
                  }
                >
                  <ShieldCheck size={16} />
                  <span>Admin</span>
                </NavLink>
              )}
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
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            <span className="small">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-3">
              {/* Real-time Notification Bell */}
              <NotificationBell />

              {/* User Account / Profile Link */}
              <Link
                to="/profile"
                className="text-decoration-none text-end d-none d-sm-block p-1 rounded-2 hover-bg"
                title="Manage Profile & Settings"
              >
                <div className="fw-semibold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <User size={14} className="text-primary" />
                  <span>{user?.name}</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {user?.role}
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline-danger rounded-2 d-flex align-items-center gap-1"
                title="Sign out of account"
              >
                <LogOut size={14} />
                <span className="d-none d-md-inline">Logout</span>
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