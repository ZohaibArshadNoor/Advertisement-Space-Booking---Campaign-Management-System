import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../profileApi';
import { User, Mail, Lock, Shield, Building, Save, Key, CheckCircle, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth();

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
      setProfileSuccess('Your profile details have been updated successfully.');
      if (res.user) {
        // Refresh token / local storage session with updated name/email
        const token = localStorage.getItem('access_token');
        if (token) {
          login(token, res.user);
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

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
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
    <div className="container-fluid px-0" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="mb-4">
        <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <User className="text-primary" size={28} />
          Account & Profile Settings
        </h2>
        <p className="text-muted small mb-0">Manage your personal credentials, contact email, and security settings</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Account Details */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center gap-2">
              <User size={18} className="text-primary" />
              <h5 className="fw-bold mb-0">Personal Profile</h5>
            </div>
            <div className="card-body p-4">
              {profileSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 small">
                  <CheckCircle size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small">
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Full Legal Name *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Email Address *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Notifications and invoices will be delivered to this email.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Assigned System Role</label>
                  <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                    <span className="fw-semibold text-dark small d-flex align-items-center gap-2">
                      <Shield size={16} className="text-primary" />
                      {user?.role || 'User'}
                    </span>
                    <span className="badge bg-primary-subtle text-primary">Managed by Admin</span>
                  </div>
                </div>

                <div className="text-end pt-2">
                  <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={updatingProfile}>
                    <Save size={16} />
                    {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Password & Security */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center gap-2">
              <Lock size={18} className="text-danger" />
              <h5 className="fw-bold mb-0">Change Password</h5>
            </div>
            <div className="card-body p-4">
              {passwordSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 small">
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Current Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">New Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Confirm New Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-2" disabled={updatingPassword}>
                    <Lock size={16} />
                    {updatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
