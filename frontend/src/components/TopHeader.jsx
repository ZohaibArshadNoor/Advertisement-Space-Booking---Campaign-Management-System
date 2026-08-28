import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationsApi } from '../features/notifications/notificationsApi';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Search,
  Check
} from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  users: 'User Management',
  spaces: 'Advertising Spaces',
  availability: 'Availability Calendar',
  campaigns: 'Campaigns',
  bookings: 'Bookings',
  creatives: 'Creatives Review',
  payments: 'Invoices & Billing',
  notifications: 'Notifications',
  audit: 'Audit Trail',
  settings: 'System Settings',
  profile: 'My Profile',
};

const DEMO_ROLES = [
  { role: 'Administrator', email: 'admin@test.com', name: 'System Administrator' },
  { role: 'Space Manager', email: 'spaces@test.com', name: 'Tariq Mahmood' },
  { role: 'Sales Executive', email: 'sales@test.com', name: 'Sara Khan' },
  { role: 'Creative Reviewer', email: 'reviewer@test.com', name: 'Zainab Malik' },
  { role: 'Finance Officer', email: 'finance@test.com', name: 'Farhan Siddiqui' },
  { role: 'Advertiser', email: 'advertiser@test.com', name: 'Ali Hassan (Jazz Marketing)' },
];

export const TopHeader = ({ onMobileToggle, unreadCount, setUnreadCount }) => {
  const { user, login, demoSwitch, loginWithToken, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notifications count for bell badge
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await notificationsApi.getUnreadCount();
        if (data.unread_count !== undefined && setUnreadCount) {
          setUnreadCount(data.unread_count);
        }
      } catch (err) {
        // Silently ignore background polling errors
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  // Load preview stream when opening notification drawer
  const handleToggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      setLoadingNotifications(true);
      try {
        const data = await notificationsApi.getNotifications({ per_page: 5 });
        setRecentNotifications(data.notifications || data.items || []);
      } catch (err) {
        console.error('Failed to load top notification drawer', err);
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  // Quick Demo Persona Switcher (obtains real role-scoped JWT token)
  const handleQuickSwitchRole = async (demoUser) => {
    setShowRoleSwitcher(false);
    try {
      if (demoSwitch) {
        await demoSwitch({ role: demoUser.role, email: demoUser.email });
      } else {
        await login({ email: demoUser.email, password: 'password123' });
      }
      navigate('/dashboard');
      // Reload page to refresh all active queries and permissions
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Demo persona switch failed:', err);
    }
  };

  // Build breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[0] || 'dashboard';
  const pageLabel = ROUTE_LABELS[currentSection] || currentSection.charAt(0).toUpperCase() + currentSection.slice(1);

  return (
    <header className="app-header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="header-left">
        <button
          type="button"
          className="btn-ui-icon d-lg-none"
          onClick={onMobileToggle}
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <Link to="/dashboard" className="breadcrumb-item-link">
            Home
          </Link>
          <span className="text-muted">/</span>
          <span className="breadcrumb-active">{pageLabel}</span>
        </nav>
      </div>

      {/* Right: Actions, Theme, Notifications, User */}
      <div className="header-right">
        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-ui-icon"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell with Unread Dropdown */}
        <div className="position-relative" ref={notifRef}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="btn-ui-icon position-relative"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="position-absolute badge rounded-pill bg-danger d-flex align-items-center justify-content-center text-white font-monospace"
                style={{
                  top: '2px',
                  right: '2px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 3px',
                  lineHeight: 1,
                  boxShadow: '0 0 0 2px var(--color-bg-surface, #1e293b)',
                  zIndex: 2,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="card-enterprise position-absolute end-0 mt-2 shadow-lg border"
              style={{
                width: '380px',
                zIndex: 1050,
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-surface, #ffffff)',
              }}
            >
              <div className="card-header-enterprise py-2.5 px-3 d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-sm text-primary-emphasis">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge bg-primary text-xs rounded-pill">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="btn btn-link p-0 text-xs text-decoration-none text-primary fw-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="p-0 overflow-y-auto" style={{ maxHeight: '340px' }}>
                {loadingNotifications ? (
                  <div className="text-center py-4 text-muted text-xs">Loading notifications...</div>
                ) : recentNotifications.length === 0 ? (
                  <div className="text-center py-4 text-muted text-xs">
                    No recent notifications
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border-bottom text-start position-relative transition-all"
                      style={{
                        backgroundColor: !n.is_read ? 'var(--color-bg-subtle, rgba(37, 99, 235, 0.06))' : 'transparent',
                        borderLeft: !n.is_read ? '3px solid var(--color-primary, #2563eb)' : '3px solid transparent',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <span className="fw-semibold text-xs text-primary-emphasis" style={{ lineHeight: 1.3 }}>
                          {n.title}
                        </span>
                        <span className="text-muted flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-0 line-clamp-2" style={{ lineHeight: 1.4, fontSize: '0.78rem' }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-top text-center bg-subtle">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs fw-semibold text-primary text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                >
                  <span>View all system notifications</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="position-relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="btn-ui btn-ui-ghost btn-ui-sm d-flex align-items-center gap-2 p-1 pe-2"
          >
            <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="d-none d-sm-inline fw-semibold text-xs">{user?.name || 'Account'}</span>
            <ChevronDown size={13} className="text-muted" />
          </button>

          {showUserMenu && (
            <div
              className="card-enterprise position-absolute end-0 mt-2 shadow-lg"
              style={{
                width: '260px',
                zIndex: 100,
                padding: '1.15rem',
                borderRadius: '10px',
              }}
            >
              {/* User Identity Info */}
              <div className="d-flex flex-column align-items-start">
                <div
                  className="fw-bold text-primary-emphasis text-truncate w-100"
                  style={{ fontSize: '0.95rem', lineHeight: 1.3 }}
                >
                  {user?.name || 'System Administrator'}
                </div>
                <div
                  className="text-muted text-truncate w-100 mt-0.5 mb-2"
                  style={{ fontSize: '0.78rem' }}
                >
                  {user?.email || 'admin@example.com'}
                </div>
                <span
                  className="badge bg-primary-subtle text-primary font-monospace text-xs px-2.5 py-1 rounded-pill"
                  style={{ fontSize: '0.72rem' }}
                >
                  {user?.role || 'Administrator'}
                </span>
              </div>

              {/* Separator */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--color-border)',
                  width: '100%',
                  margin: '0.85rem 0 0.5rem',
                }}
              />

              {/* Navigation Items */}
              <div className="d-flex flex-column gap-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="dropdown-item px-3 py-2 text-xs rounded-2 d-flex align-items-center gap-2.5 text-decoration-none text-secondary hover-bg transition-all"
                  style={{ fontSize: '0.84rem' }}
                >
                  <User size={16} className="text-primary flex-shrink-0" />
                  <span className="fw-medium">My Profile</span>
                </Link>

                {user?.role === 'Administrator' && (
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="dropdown-item px-3 py-2 text-xs rounded-2 d-flex align-items-center gap-2.5 text-decoration-none text-secondary hover-bg transition-all"
                    style={{ fontSize: '0.84rem' }}
                  >
                    <Sliders size={16} className="text-primary flex-shrink-0" />
                    <span className="fw-medium">Platform Settings</span>
                  </Link>
                )}

                {/* Separator */}
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--color-border)',
                    width: '100%',
                    margin: '0.5rem 0',
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-100 text-start px-3 py-2 text-xs rounded-2 d-flex align-items-center gap-2.5 border-0 bg-transparent text-danger fw-semibold hover-bg transition-all"
                  style={{ cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  <LogOut size={16} className="flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
