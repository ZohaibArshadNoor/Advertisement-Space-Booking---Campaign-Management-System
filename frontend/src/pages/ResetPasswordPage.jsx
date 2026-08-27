import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../features/auth/authApi';
import PublicNavbar from '../components/PublicNavbar';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setSuccess(res.message || 'Password successfully updated! You can now sign in.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Password reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center py-5" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <PublicNavbar />
      <div className="container" style={{ maxWidth: '440px', marginTop: '70px', marginBottom: '40px' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
            style={{ width: '52px', height: '52px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#2563eb' }}
          >
            <KeyRound size={26} />
          </div>
          <h1 className="fw-bold fs-5 text-primary-emphasis mb-1">Set New Password</h1>
          <p className="text-muted small mb-0">Create a secure password to protect your AdFlow account</p>
        </div>

        <div className="card-enterprise p-4 mb-4 shadow-md">
          {success && (
            <div className="alert-ui alert-success mb-3">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs">
                {success}
                <div className="mt-1 fw-semibold">Redirecting to login in 2 seconds...</div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-ui alert-danger mb-3">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs">{error}</div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group-ui mb-3">
                <label className="form-label-ui mb-1.5" htmlFor="new-password">
                  New Password
                </label>
                <div className="position-relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input-ui"
                    style={{ paddingRight: '2.75rem' }}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !token}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none d-flex align-items-center justify-content-center"
                    style={{ zIndex: 5, padding: '0.4rem 0.75rem' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group-ui mb-4">
                <label className="form-label-ui mb-1.5" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-ui"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2 mb-3"
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-top">
            <Link to="/login" className="text-xs text-primary text-decoration-none d-inline-flex align-items-center gap-1.5 fw-medium">
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
