import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../features/auth/authApi';
import PublicNavbar from '../components/PublicNavbar';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSuccess(
        res.message ||
        'If an account with that email exists, a password reset link has been dispatched to your inbox.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to process password reset request. Please check your network and try again.'
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
          <h1 className="fw-bold fs-5 text-primary-emphasis mb-1">Reset Account Password</h1>
          <p className="text-muted small mb-0">Enter your email to receive a secure password recovery link</p>
        </div>

        <div className="card-enterprise p-4 mb-4 shadow-md">
          {success && (
            <div className="alert-ui alert-success mb-4">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs">
                {success}
                <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                  Please check your inbox (and spam folder) and click the link to proceed.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert-ui alert-danger mb-4">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs">{error}</div>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group-ui mb-4">
                <label className="form-label-ui mb-1.5" htmlFor="reset-email">
                  Work Email Address
                </label>
                <div className="position-relative">
                  <span className="position-absolute start-0 top-50 translate-middle-y ps-3 text-muted">
                    <Mail size={15} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input-ui"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <span className="form-helper-text">
                  We'll send a 1-hour secure password reset link to this address.
                </span>
              </div>

              <button
                type="submit"
                className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => { setSuccess(''); setEmail(''); }}
              className="btn-ui btn-ui-secondary w-100 justify-content-center py-2.5 mb-3"
            >
              Send Another Reset Link
            </button>
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

export default ForgotPasswordPage;
