import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../profileApi';
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
  Laptop
} from 'lucide-react';

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

  return (
    <div style={{ maxWidth: '880px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account &amp; Security</h1>
          <p className="page-subtitle">
            Manage your personal profile, credentials, and notification settings.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="card-enterprise p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="fw-bold text-sm text-primary-emphasis mb-0.5">{user?.name}</h3>
            <div className="text-muted text-xs mb-1">{user?.email}</div>
            <div className="d-flex gap-2">
              <span className="badge bg-primary text-xs">{user?.role}</span>
              <span className="badge bg-success-subtle text-success text-xs">Active Session</span>
            </div>
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
          <span>Personal Info</span>
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

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="card-enterprise p-4">
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

            <div className="form-group-ui mb-4">
              <label className="form-label-ui">Assigned Role</label>
              <input
                type="text"
                className="form-input-ui bg-subtle"
                value={user?.role || ''}
                disabled
              />
              <span className="form-helper-text">
                Your role determines your workspace permissions. Contact a Super Admin to request adjustments.
              </span>
            </div>

            <button
              type="submit"
              className="btn-ui btn-ui-primary btn-ui-sm"
              disabled={updatingProfile}
            >
              <Save size={14} />
              <span>{updatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <div className="card-enterprise p-4">
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
            <div className="form-group-ui">
              <label className="form-label-ui">Current Password</label>
              <input
                type="password"
                className="form-input-ui"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

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

            <div className="form-group-ui mb-4">
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

            <button
              type="submit"
              className="btn-ui btn-ui-primary btn-ui-sm"
              disabled={updatingPassword}
            >
              <Key size={14} />
              <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>

          {/* Active Session info */}
          <div className="border-top mt-4 pt-3">
            <h4 className="fw-bold text-xs text-primary-emphasis mb-2">Active Session Details</h4>
            <div className="p-3 rounded bg-subtle border d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Laptop size={18} className="text-primary" />
                <div>
                  <div className="fw-semibold text-xs text-primary-emphasis">Current Web Browser Session</div>
                  <div className="text-muted text-xs">IP: 127.0.0.1 • Authenticated via JWT</div>
                </div>
              </div>
              <span className="badge bg-success-subtle text-success text-xs">Active Now</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === 'preferences' && (
        <div className="card-enterprise p-4">
          <h4 className="fw-bold text-sm text-primary-emphasis mb-3">Notification Subscriptions</h4>
          <div className="d-flex flex-column gap-3 mb-4">
            <label className="d-flex align-items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.bookingAlerts}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, bookingAlerts: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Booking Status Updates</div>
                <div className="text-muted text-xs">Receive alerts when space reservations are confirmed or modified.</div>
              </div>
            </label>

            <label className="d-flex align-items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.creativeApprovals}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, creativeApprovals: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Creative Content Approvals</div>
                <div className="text-muted text-xs">Receive verification approvals and compliance rejection notes.</div>
              </div>
            </label>

            <label className="d-flex align-items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="form-check-input mt-0.5"
                checked={notifPreferences.invoiceNotices}
                onChange={(e) => setNotifPreferences({ ...notifPreferences, invoiceNotices: e.target.checked })}
              />
              <div>
                <div className="fw-semibold text-xs text-primary-emphasis">Invoice &amp; Payment Receipts</div>
                <div className="text-muted text-xs">Get notified when new billing invoices are issued or payments reconciled.</div>
              </div>
            </label>
          </div>

          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm"
            onClick={() => alert('Notification preferences saved.')}
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
