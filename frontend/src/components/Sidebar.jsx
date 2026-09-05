import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  CalendarDays,
  Megaphone,
  Layers,
  Image as ImageIcon,
  CreditCard,
  Bell,
  Sliders,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  X,
  Sparkles
} from 'lucide-react';

const ROLE_BADGE_CLASSES = {
  Administrator: 'role-admin',
  Advertiser: 'role-advertiser',
  'Sales Executive': 'role-sales',
  'Space Manager': 'role-space',
  'Creative Reviewer': 'role-creative',
  'Finance Officer': 'role-finance',
};

export const Sidebar = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  unreadCount = 0,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || 'Advertiser';
  const isAdmin = userRole === 'Administrator';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define authorized navigation items based on role
  const isAuthorized = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(userRole);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="modal-backdrop-ui d-lg-none"
          onClick={() => setMobileOpen(false)}
          style={{ zIndex: 39 }}
        />
      )}

      <aside
        className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Header / Brand */}
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <div className="brand-icon-box">AD</div>
            {!collapsed && (
              <div className="brand-info">
                <span className="brand-name">AdFlow</span>
                <span className="brand-tag">Enterprise OOH</span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="btn-ui-icon d-lg-none"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="btn-ui-icon d-none d-lg-flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav">
          {/* GROUP 1: OVERVIEW */}
          <div>
            {!collapsed && <div className="nav-group-title">Overview</div>}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </div>

          {/* GROUP 2: MANAGEMENT */}
          <div>
            {!collapsed && <div className="nav-group-title">Management</div>}

            {/* Users (Admin Only) */}
            {isAuthorized(['Administrator']) && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="User Management"
              >
                <Users size={18} />
                {!collapsed && <span>Users</span>}
              </NavLink>
            )}

            {/* Advertising Spaces (All Users) */}
            <NavLink
              to="/spaces"
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title="Advertising Spaces"
            >
              <Building2 size={18} />
              {!collapsed && <span>Ad Spaces</span>}
            </NavLink>

            {/* Space Availability */}
            <NavLink
              to="/availability"
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title="Availability Calendar"
            >
              <CalendarDays size={18} />
              {!collapsed && <span>Availability</span>}
            </NavLink>

            {/* Campaigns (Advertiser, Sales, Admin) */}
            {isAuthorized(['Advertiser', 'Sales Executive', 'Administrator']) && (
              <NavLink
                to="/campaigns"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Campaigns"
              >
                <Megaphone size={18} />
                {!collapsed && <span>Campaigns</span>}
              </NavLink>
            )}

            {/* Influencer Marketplace (Advertiser, Sales Executive, Administrator, Space Manager) */}
            {isAuthorized([
              'Advertiser',
              'Sales Executive',
              'Space Manager',
              'Administrator',
            ]) && (
              <NavLink
                to="/influencers"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Influencers & Creators"
              >
                <Sparkles size={18} />
                {!collapsed && <span>Influencers</span>}
              </NavLink>
            )}

            {/* Bookings (Advertiser, Sales, Space Manager, Admin) */}
            {isAuthorized([
              'Advertiser',
              'Sales Executive',
              'Space Manager',
              'Administrator',
            ]) && (
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Bookings"
              >
                <Layers size={18} />
                {!collapsed && <span>Bookings</span>}
              </NavLink>
            )}

            {/* Creatives (Creative Reviewer, Advertiser, Admin) */}
            {isAuthorized([
              'Creative Reviewer',
              'Advertiser',
              'Administrator',
            ]) && (
              <NavLink
                to="/creatives"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Creatives Review"
              >
                <ImageIcon size={18} />
                {!collapsed && <span>Creatives</span>}
              </NavLink>
            )}

            {/* Invoices & Payments (Finance Officer, Advertiser, Admin) */}
            {isAuthorized([
              'Finance Officer',
              'Advertiser',
              'Administrator',
            ]) && (
              <NavLink
                to="/payments"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Invoices & Billing"
              >
                <CreditCard size={18} />
                {!collapsed && <span>Billing & Payments</span>}
              </NavLink>
            )}
          </div>

          {/* GROUP 3: COMMUNICATION */}
          <div>
            {!collapsed && <div className="nav-group-title">Communication</div>}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title="Notifications"
            >
              <Bell size={18} />
              {!collapsed && <span>Notifications</span>}
              {unreadCount > 0 && (
                <span className="nav-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* GROUP 4: SYSTEM */}
          <div>
            {!collapsed && <div className="nav-group-title">System</div>}

            {/* Audit Logs (Admin Only) */}
            {isAuthorized(['Administrator']) && (
              <NavLink
                to="/audit"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="Audit Trail"
              >
                <Activity size={18} />
                {!collapsed && <span>Audit Trail</span>}
              </NavLink>
            )}

            {/* Settings (Admin Only) */}
            {isAuthorized(['Administrator']) && (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                title="System Settings"
              >
                <Sliders size={18} />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            )}

            {/* Profile (All Users) */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title="My Profile"
            >
              <User size={18} />
              {!collapsed && <span>Profile</span>}
            </NavLink>
          </div>
        </nav>

        {/* Footer / User Badge */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="flex-grow-1 overflow-hidden me-2">
                <div className="text-truncate fw-semibold text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name || 'Authorized User'}
                </div>
                <div className="d-flex align-items-center gap-1 mt-0.5">
                  <span className={`role-badge ${ROLE_BADGE_CLASSES[userRole] || 'role-advertiser'}`}>
                    {userRole}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ui-icon ms-auto text-danger"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
