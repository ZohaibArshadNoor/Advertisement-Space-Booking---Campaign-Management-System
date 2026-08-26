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
  roles: 'Role Permissions',
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
  const { user, loginWithToken, logout } = useAuth();
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

  // Fetch unread count & recent notifications
  const fetchUnread = async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res && res.count !== undefined) {
        setUnreadCount(res.count);
      }
    } catch (err) {
      // quiet fallback
    }
  };

  const fetchRecent = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationsApi.getNotifications({ page: 1, per_page: 5, unread_only: false });
      setRecentNotifications(res.notifications || []);
    } catch (err) {
      // quiet fallback
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      fetchRecent();
    }
    setShowNotifications(!showNotifications);
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

  // Quick Demo Persona Switcher
  const handleQuickSwitchRole = (demoUser) => {
    // Re-login / simulate user persona switch
    loginWithToken(
      localStorage.getItem('access_token') || 'demo-token',
      {
        id: user?.id || 1,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        is_active: true,
      }
    );
    setShowRoleSwitcher(false);
    navigate('/dashboard');
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

      {/* Right: Actions, Role Switcher, Theme, Notifications, User */}
      <div className="header-right">
        {/* Quick Persona / Role Switcher for Testing */}
        <div className="position-relative" ref={roleMenuRef}>
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm d-none d-md-inline-flex align-items-center gap-1.5"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            title="Switch Testing Persona"
          >
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-xs">{user?.role || 'Switch Role'}</span>
            <ChevronDown size={12} className="text-muted" />
          </button>

          {showRoleSwitcher && (
            <div
              className="card-enterprise position-absolute end-0 mt-2 p-2 shadow-lg"
              style={{ width: '250px', zIndex: 100 }}
            >
              <div className="px-2 py-1 border-bottom mb-1">
                <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">
                  Test Personas
                </span>
              </div>
              {DEMO_ROLES.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleQuickSwitchRole(demo)}
                  className={`w-100 text-start px-2 py-1.5 rounded text-xs d-flex align-items-center justify-content-between border-0 bg-transparent hover-bg ${
                    user?.role === demo.role ? 'fw-bold text-primary bg-light' : 'text-secondary'
                  }`}
                >
                  <div>
                    <div>{demo.role}</div>
                    <small className="text-muted" style={{ fontSize: '0.68rem' }}>{demo.name}</small>
                  </div>
                  {user?.role === demo.role && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

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
                className="position-absolute top-1 end-1 p-1 bg-danger border border-light rounded-circle"
                style={{ width: '8px', height: '8px' }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="card-enterprise position-absolute end-0 mt-2 shadow-lg"
              style={{ width: '340px', zIndex: 100 }}
            >
              <div className="card-header-enterprise py-2 px-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-sm">Notifications</span>
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
                    className="btn btn-link p-0 text-xs text-decoration-none"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="p-0 overflow-y-auto" style={{ maxHeight: '300px' }}>
                {loadingNotifications ? (
                  <div className="text-center py-4 text-muted small">Loading...</div>
                ) : recentNotifications.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No recent notifications
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 border-bottom text-start ${
                        !n.is_read ? 'bg-primary-subtle bg-opacity-25' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-semibold text-xs text-primary-emphasis">
                          {n.title}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-0 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-top text-center bg-subtle">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs fw-semibold text-primary text-decoration-none d-flex align-items-center justify-content-center gap-1"
                >
                  <span>View all notifications</span>
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
              className="card-enterprise position-absolute end-0 mt-2 p-1.5 shadow-lg"
              style={{ width: '220px', zIndex: 100 }}
            >
              <div className="px-3 py-2 border-bottom mb-1">
                <div className="fw-bold text-xs text-truncate">{user?.name}</div>
                <div className="text-muted text-xs text-truncate">{user?.email}</div>
                <span className="badge bg-secondary-subtle text-secondary text-xs mt-1">
                  {user?.role}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="dropdown-item px-3 py-1.5 text-xs rounded d-flex align-items-center gap-2 text-decoration-none text-secondary hover-bg"
              >
                <User size={14} />
                <span>My Profile</span>
              </Link>

              {user?.role === 'Administrator' && (
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="dropdown-item px-3 py-1.5 text-xs rounded d-flex align-items-center gap-2 text-decoration-none text-secondary hover-bg"
                >
                  <Sliders size={14} />
                  <span>Platform Settings</span>
                </Link>
              )}

              <div className="border-top my-1"></div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-100 text-start px-3 py-1.5 text-xs rounded d-flex align-items-center gap-2 border-0 bg-transparent text-danger hover-bg"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
