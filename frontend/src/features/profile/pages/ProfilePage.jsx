import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../profileApi';
import { authApi } from '../../auth/authApi';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Building2,
  Save,
  Key,
  CheckCircle2,
  AlertCircle,
  Bell,
  Activity,
  Laptop,
  Send,
  Sparkles,
  Layers,
  Megaphone,
  CreditCard,
  FileCheck,
  Check,
  Shield,
  Clock
} from 'lucide-react';

const ROLE_METADATA = {
  Advertiser: {
    title: 'Commercial Advertiser Workspace',
    description: 'Direct advertiser account authorized to plan campaigns, book physical and digital inventory, and upload creative media artwork.',
    badgeClass: 'bg-primary-subtle text-primary border-primary-subtle',
    color: '#2563eb',
    categories: [
      {
        category: 'Campaign & Placements',
        icon: Megaphone,
        permissions: [
          { code: 'CAMPAIGN.CREATE', name: 'Create Campaigns', desc: 'Launch and configure flighting ad schedules with target budgets.' },
          { code: 'CAMPAIGN.VIEW_OWN', name: 'View Own Campaigns', desc: 'Real-time performance tracking and flight monitoring for own brand.' },
          { code: 'BOOKING.CREATE', name: 'Reserve & Book Spaces', desc: 'Select billboard spaces, review dates, and submit reservation holds.' },
          { code: 'BOOKING.VIEW_OWN', name: 'View Own Bookings', desc: 'Track space booking confirmation status, dates, and locations.' },
        ]
      },
      {
        category: 'Media & Creatives',
        icon: FileCheck,
        permissions: [
          { code: 'CREATIVE.UPLOAD', name: 'Upload Media Assets', desc: 'Upload high-resolution images, animations, and video commercials.' },
          { code: 'CREATIVE.VIEW_OWN', name: 'Track Approval Status', desc: 'Monitor compliance review status and reviewer feedback on uploaded creatives.' },
        ]
      },
      {
        category: 'Billing & Financials',
        icon: CreditCard,
        permissions: [
          { code: 'INVOICE.VIEW_OWN', name: 'Access Invoices & Billing', desc: 'View issued tax invoices, 16% GST breakdown, and payment due dates.' },
          { code: 'PAYMENT.SUBMIT', name: 'Submit Payment Records', desc: 'Log bank wire, cheque, and card payment receipts for settlement.' },
        ]
      }
    ]
  },
  'Sales Executive': {
    title: 'Commercial Sales & Business Pipeline',
    description: 'Commercial operations authorized to manage client proposals, negotiate bookings, and transition advertising campaigns.',
    badgeClass: 'bg-indigo-subtle text-indigo border-indigo-subtle',
    color: '#6366f1',
    categories: [
      {
        category: 'Campaign Management',
        icon: Megaphone,
        permissions: [
          { code: 'CAMPAIGN.VIEW_ALL', name: 'View All Client Campaigns', desc: 'Inspect complete campaign pipeline across all enterprise advertisers.' },
          { code: 'CAMPAIGN.UPDATE_STATUS', name: 'Update Campaign Lifecycle', desc: 'Transition campaigns across Draft, Active (Approved), Paused, and Completed.' },
          { code: 'CAMPAIGN.DELETE', name: 'Delete Campaign Drafts', desc: 'Purge draft campaigns without active financial or booking obligations.' },
        ]
      },
      {
        category: 'Bookings & Inventory',
        icon: Layers,
        permissions: [
          { code: 'BOOKING.VIEW_ALL', name: 'View All Space Bookings', desc: 'Inspect full network calendar and reservation requests from clients.' },
          { code: 'BOOKING.CONFIRM', name: 'Confirm & Cancel Bookings', desc: 'Approve client space holds, lock calendar slots, or release slots on cancellation.' },
          { code: 'AVAILABILITY.CHECK', name: 'Check Real-time Availability', desc: 'Query space calendars for collision-free reservation dates.' },
        ]
      },
      {
        category: 'Billing Oversight',
        icon: CreditCard,
        permissions: [
          { code: 'INVOICE.VIEW_ALL', name: 'View Client Invoices', desc: 'Access commercial billing records and monitor payment progress.' },
        ]
      }
    ]
  },
  'Space Manager': {
    title: 'Physical & Digital Inventory Management',
    description: 'OOH Asset management authorized to register billboard spaces, configure rate cards, and schedule maintenance blackouts.',
    badgeClass: 'bg-emerald-subtle text-emerald border-emerald-subtle',
    color: '#10b981',
    categories: [
      {
        category: 'Billboard Inventory',
        icon: Building2,
        permissions: [
          { code: 'SPACE.CREATE', name: 'Register Advertising Spaces', desc: 'Add new digital SMD screens, unipoles, gantries, and static billboards.' },
          { code: 'SPACE.UPDATE', name: 'Update Space Specifications', desc: 'Modify dimensions, daily/monthly rates, lighting, and GPS coordinates.' },
          { code: 'SPACE.VIEW_ALL', name: 'Manage Inventory Catalog', desc: 'Full access to space inventory specifications and operational status.' },
        ]
      },
      {
        category: 'Availability & Scheduling',
        icon: Clock,
        permissions: [
          { code: 'AVAILABILITY.MANAGE', name: 'Manage Availability Schedules', desc: 'Schedule maintenance blackouts, structural inspections, and block slots.' },
          { code: 'BOOKING.CONFIRM', name: 'Confirm Space Reservations', desc: 'Verify physical site availability and lock reservation dates.' },
        ]
      }
    ]
  },
  'Creative Reviewer': {
    title: 'Media Quality & Compliance Assurance',
    description: 'Creative operations authorized to inspect media artwork, enforce aspect ratio compliance, and clear media for broadcast.',
    badgeClass: 'bg-amber-subtle text-amber border-amber-subtle',
    color: '#f59e0b',
    categories: [
      {
        category: 'Media Review Queue',
        icon: FileCheck,
        permissions: [
          { code: 'CREATIVE.VIEW_QUEUE', name: 'Access Review Queue', desc: 'Inspect pending artwork submissions, technical specs, and dimensions.' },
          { code: 'CREATIVE.APPROVE', name: 'Approve Media Assets', desc: 'Clear compliant high-resolution creative materials for live broadcast.' },
          { code: 'CREATIVE.REJECT', name: 'Reject with Feedback', desc: 'Flag policy violations or incorrect aspect ratios with rejection feedback.' },
        ]
      },
      {
        category: 'Campaign & Inventory Context',
        icon: Layers,
        permissions: [
          { code: 'CAMPAIGN.VIEW_SUMMARY', name: 'Inspect Campaign Context', desc: 'Verify the flighting dates and target billboard specs of the media.' },
        ]
      }
    ]
  },
  'Finance Officer': {
    title: 'Financial Settlements & Commercial Invoicing',
    description: 'Corporate treasury authorized to issue commercial invoices, verify wire transfers and cheques, and reconcile client accounts.',
    badgeClass: 'bg-teal-subtle text-teal border-teal-subtle',
    color: '#0d9488',
    categories: [
      {
        category: 'Invoicing & Tax Management',
        icon: CreditCard,
        permissions: [
          { code: 'INVOICE.CREATE', name: 'Issue Commercial Invoices', desc: 'Generate enterprise invoices with automatic 16% Provincial GST calculations.' },
          { code: 'INVOICE.VIEW_ALL', name: 'Manage Invoices Ledger', desc: 'Track issued, partially paid, paid, and overdue commercial invoices.' },
          { code: 'INVOICE.UPDATE_STATUS', name: 'Update Invoice Lifecycle', desc: 'Adjust billing status and issue credit adjustments.' },
        ]
      },
      {
        category: 'Payment Settlements',
        icon: ShieldCheck,
        permissions: [
          { code: 'PAYMENT.RECORD', name: 'Record Direct Payments', desc: 'Log corporate bank wires, cash deposits, and direct account settlements.' },
          { code: 'PAYMENT.VERIFY', name: 'Reconcile & Clear Payments', desc: 'Verify bank deposit records and mark client settlements as COMPLETED.' },
          { code: 'PAYMENT.VIEW_ALL', name: 'Settlement Transactions Ledger', desc: 'Inspect full chronological audit log of all financial transactions.' },
        ]
      }
    ]
  },
  Administrator: {
    title: 'Super Administrator Master Controls',
    description: 'Root administrator with unrestricted bypass and governance across all system modules, user accounts, and immutable audit logs.',
    badgeClass: 'bg-danger-subtle text-danger border-danger-subtle',
    color: '#ef4444',
    categories: [
      {
        category: 'User & Access Governance',
        icon: Shield,
        permissions: [
          { code: 'USER.MANAGE_ALL', name: 'Full User Account Control', desc: 'Create, update, activate, deactivate, and assign roles across all users.' },
          { code: 'ROLE.MANAGE_PERMISSIONS', name: 'RBAC Permission Matrix', desc: 'Configure role-based access control policies and permission assignments.' },
        ]
      },
      {
        category: 'System & Platform Administration',
        icon: Laptop,
        permissions: [
          { code: 'SYSTEM.PANORAMIC_BYPASS', name: 'Master System Bypass', desc: 'Unrestricted create, read, update, and delete access across all models.' },
          { code: 'AUDIT.VIEW_IMMUTABLE', name: 'Security Audit Logs', desc: 'Inspect immutable database audit trails, IP addresses, and mutation event diffs.' },
          { code: 'INVENTORY.OVERRIDE', name: 'Full Inventory Override', desc: 'Direct authority to force-lock, unlock, or delete billboard spaces and bookings.' },
        ]
      }
    ]
  }
};

export const ProfilePage = () => {
  const { user, loginWithToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences'

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Reset Email Flow State
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState('');

  // Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    bookingAlerts: true,
    creativeApprovals: true,
    invoiceNotices: true,
    securityAudits: false,
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await profileApi.updateProfile({ name, email });
      setProfileSuccess('Profile details have been updated successfully.');
      if (res.user) {
        const token = localStorage.getItem('access_token');
        if (token) {
          loginWithToken(token, res.user);
        }
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile information.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setSendingResetEmail(true);
    setResetEmailSuccess('');
    setPasswordError('');
    try {
      await authApi.forgotPassword(user?.email || email);
      setResetEmailSuccess(`A secure password reset link has been dispatched to ${user?.email || email}. Check your inbox!`);
    } catch (err) {
      setPasswordError('Failed to dispatch password reset email. Please try again.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const currentRole = user?.role || 'Advertiser';
  const roleMeta = ROLE_METADATA[currentRole] || ROLE_METADATA['Advertiser'];

  return (
    <div style={{ maxWidth: '940px' }} className="mx-auto pb-5">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">My Account &amp; Workspace Profile</h1>
          <p className="page-subtitle">
            Manage your credentials, explore assigned role capabilities, and configure system preferences.
          </p>
        </div>
      </div>

      {/* Profile Banner Card */}
      <div className="card-enterprise p-4 mb-4 shadow-sm border">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="user-avatar shadow-sm d-flex align-items-center justify-content-center text-white fw-bold rounded-3"
              style={{
                width: '56px',
                height: '56px',
                fontSize: '1.4rem',
                backgroundColor: roleMeta.color,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="fw-bold fs-5 text-primary-emphasis mb-0">{user?.name || 'Workspace User'}</h2>
                <span className={`badge ${roleMeta.badgeClass} text-xs font-monospace px-2.5 py-1 text-uppercase`}>
                  {currentRole}
                </span>
              </div>
              <div className="text-muted text-xs d-flex align-items-center gap-2">
                <Mail size={13} />
                <span>{user?.email}</span>
                <span>•</span>
                <span className="badge bg-success-subtle text-success text-xs">
                  <Check size={11} className="me-1" /> Active Session
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => setActiveTab('security')}
            >
              <Key size={14} />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex gap-2 border-bottom mb-4 pb-2">
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'profile' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={14} />
          <span>Profile &amp; Permissions</span>
        </button>
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'security' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={14} />
          <span>Password &amp; Security</span>
        </button>
        <button
          type="button"
          className={`btn-ui btn-ui-sm ${activeTab === 'preferences' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Bell size={14} />
          <span>Alert Preferences</span>
        </button>
      </div>

      {/* Tab 1: Profile & Permissions Matrix */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Personal Info Box */}
          <div className="card-enterprise p-4 mb-4">
            <h3 className="card-title-enterprise mb-3">Personal Details</h3>

            {profileSuccess && (
              <div className="alert-ui alert-success mb-3">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <div className="flex-grow-1 text-xs">{profileSuccess}</div>
              </div>
            )}
            {profileError && (
              <div className="alert-ui alert-danger mb-3">
                <AlertCircle size={15} className="flex-shrink-0" />
                <div className="flex-grow-1 text-xs">{profileError}</div>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="form-group-ui">
                    <label className="form-label-ui">Full Name</label>
                    <input
                      type="text"
                      className="form-input-ui"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="form-group-ui">
                    <label className="form-label-ui">Work Email Address</label>
                    <input
                      type="email"
                      className="form-input-ui"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-group-ui mb-3">
                    <label className="form-label-ui">Assigned Role</label>
                    <input
                      type="text"
                      className="form-input-ui bg-subtle"
                      value={currentRole}
                      disabled
                    />
                    <span className="form-helper-text">
                      Your role determines your workspace capabilities and operational access level.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-2"
                  disabled={updatingProfile}
                >
                  <Save size={14} />
                  <span>{updatingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Enhanced Role Capabilities & Permissions Matrix */}
          <div className="card-enterprise p-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-3 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <ShieldCheck size={18} style={{ color: roleMeta.color }} />
                  <h3 className="fw-bold text-sm text-primary-emphasis mb-0 text-uppercase tracking-wider">
                    Role Authorizations &amp; Permissions Matrix
                  </h3>
                </div>
                <p className="text-muted text-xs mb-0">
                  {roleMeta.description}
                </p>
              </div>
              <span className={`badge ${roleMeta.badgeClass} text-xs font-monospace text-uppercase px-2.5 py-1`}>
                {currentRole} Role
              </span>
            </div>

            {/* Categorized Permission Groups */}
            <div className="space-y-4">
              {roleMeta.categories.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <div key={idx} className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2.5">
                      <CatIcon size={15} className="text-primary" />
                      <h4 className="fw-bold text-xs text-primary-emphasis mb-0 text-uppercase" style={{ letterSpacing: '0.04em' }}>
                        {cat.category}
                      </h4>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {cat.permissions.map((p) => (
                        <div
                          key={p.code}
                          className="p-3 rounded-2 border bg-subtle d-flex align-items-start gap-2.5 transition-all hover-border-primary"
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                            style={{ width: '20px', height: '20px', backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace text-xs text-uppercase" style={{ letterSpacing: '0.4px', fontSize: '0.68rem' }}>
                                {p.code}
                              </span>
                              <span className="badge bg-success-subtle text-success text-xs" style={{ fontSize: '0.65rem' }}>
                                Active
                              </span>
                            </div>
                            <div className="fw-semibold text-xs text-primary-emphasis mb-1">
                              {p.name}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.73rem', lineHeight: 1.4 }}>
                              {p.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password Management */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="card-enterprise p-4 mb-4">
            <h3 className="card-title-enterprise mb-3">Change Account Password</h3>

            {passwordSuccess && (
              <div className="alert-ui alert-success mb-3">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <div className="flex-grow-1 text-xs">{passwordSuccess}</div>
              </div>
            )}
            {passwordError && (
              <div className="alert-ui alert-danger mb-3">
                <AlertCircle size={15} className="flex-shrink-0" />
                <div className="flex-grow-1 text-xs">{passwordError}</div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group-ui mb-3">
                <label className="form-label-ui">Current Password</label>
                <input
                  type="password"
                  className="form-input-ui"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="form-group-ui">
                    <label className="form-label-ui">New Password</label>
                    <input
                      type="password"
                      className="form-input-ui"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="form-group-ui">
                    <label className="form-label-ui">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input-ui"
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-2"
                disabled={updatingPassword}
              >
                <Key size={14} />
                <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

          {/* Email Reset Link Dispatch Card */}
          <div className="card-enterprise p-4 mb-4">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
              <div>
                <h3 className="card-title-enterprise mb-1 d-flex align-items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span>Send Password Reset Email</span>
                </h3>
                <p className="text-muted text-xs mb-0">
                  Prefer resetting via email link? We'll dispatch a secure 1-hour recovery link to <strong>{user?.email}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="btn-ui btn-ui-secondary btn-ui-sm d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                onClick={handleSendResetEmail}
                disabled={sendingResetEmail}
              >
                <Send size={13} />
                <span>{sendingResetEmail ? 'Sending Link...' : 'Send Reset Link to Email'}</span>
              </button>
            </div>

            {resetEmailSuccess && (
              <div className="alert-ui alert-success mt-3 mb-0">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <div className="flex-grow-1 text-xs">{resetEmailSuccess}</div>
              </div>
            )}
          </div>

          {/* Active Session info */}
          <div className="card-enterprise p-4">
            <h4 className="card-title-enterprise mb-3">Active Session Details</h4>
            <div className="p-3 rounded bg-subtle border d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <Laptop size={20} className="text-primary flex-shrink-0" />
                <div>
                  <div className="fw-semibold text-xs text-primary-emphasis">Current Web Workspace Session</div>
                  <div className="text-muted text-xs">Authenticated with Role-Scoped JWT • TLS Encrypted</div>
                </div>
              </div>
              <span className="badge bg-success-subtle text-success text-xs px-2.5 py-1">
                <Check size={11} className="me-1" /> Active Now
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === 'preferences' && (
        <div className="card-enterprise p-4">
          <h4 className="card-title-enterprise mb-3">Notification Subscriptions</h4>
          <div className="d-flex flex-column gap-3 mb-4">
            <label className="d-flex align-items-start gap-2.5 cursor-pointer p-2.5 rounded border bg-subtle">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.bookingAlerts}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, bookingAlerts: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Booking &amp; Reservation Alerts</div>
                <div className="text-muted text-xs">Receive instant updates when space reservations are confirmed, rescheduled, or cancelled.</div>
              </div>
            </label>

            <label className="d-flex align-items-start gap-2.5 cursor-pointer p-2.5 rounded border bg-subtle">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.creativeApprovals}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, creativeApprovals: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Media &amp; Creative Compliance Notes</div>
                <div className="text-muted text-xs">Get notified on media approvals, resolution verification, and feedback notes.</div>
              </div>
            </label>

            <label className="d-flex align-items-start gap-2.5 cursor-pointer p-2.5 rounded border bg-subtle">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.invoiceNotices}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, invoiceNotices: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Invoices, Billing &amp; Tax Receipts</div>
                <div className="text-muted text-xs">Receive notifications when commercial invoices are issued or payment settlements are cleared.</div>
              </div>
            </label>
          </div>

          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm d-inline-flex align-items-center gap-2"
            onClick={() => alert('Notification subscriptions updated successfully.')}
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
