import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MailCheck,
  CheckCircle2,
  Check,
  ShieldAlert
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password Security Strength Calculation
  const getPasswordCriteria = (pwd) => ({
    length: pwd.length >= 8,
    hasUpperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  });

  const criteria = getPasswordCriteria(formData.password);
  const strengthScore = Object.values(criteria).filter(Boolean).length;

  const getStrengthMeta = (score, pwd) => {
    if (!pwd) return { label: '', color: '', badgeStyle: {} };
    if (score <= 1) {
      return {
        label: 'Weak',
        color: '#ef4444',
        badgeStyle: {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      };
    }
    if (score === 2) {
      return {
        label: 'Fair',
        color: '#f59e0b',
        badgeStyle: {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        },
      };
    }
    if (score === 3) {
      return {
        label: 'Good',
        color: '#3b82f6',
        badgeStyle: {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        },
      };
    }
    return {
      label: 'Strong (Enterprise Grade)',
      color: '#10b981',
      badgeStyle: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      },
    };
  };

  const strengthMeta = getStrengthMeta(strengthScore, formData.password);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      return setError('Please fill in all required fields.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (!agreeToTerms) {
      return setError('Please agree to the Terms of Service and Privacy Policy.');
    }

    setLoading(true);
    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        if (response.requires_verification || response.message?.toLowerCase().includes('verify')) {
          setEmailSentTo(formData.email.trim());
        } else {
          navigate('/login', {
            state: { message: 'Registration successful! Please sign in.' },
          });
        }
      }
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        setError(Object.values(backendErrors).flat().join(', '));
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center py-5"
      style={{ backgroundColor: 'var(--color-bg-app)' }}
    >
      <PublicNavbar />

      <div
        className="container"
        style={{ maxWidth: '460px', marginTop: '70px', marginBottom: '40px' }}
      >
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2.5 mb-2">
            <div
              className="brand-icon-box flex-shrink-0"
              style={{ width: '38px', height: '38px', fontSize: '1rem' }}
            >
              AD
            </div>
            <span
              className="fw-bold fs-4 text-primary-emphasis"
              style={{ letterSpacing: '-0.02em' }}
            >
              AdFlow
            </span>
          </div>
          <h1 className="fw-bold fs-5 text-primary-emphasis mb-1">
            Create Advertiser Account
          </h1>
          <p className="text-muted small mb-0">
            Join the programmatic physical &amp; digital billboard network
          </p>
        </div>

        {/* Registration Card or Email Sent State */}
        <div className="card-enterprise p-4 mb-4 shadow-md">
          {emailSentTo ? (
            <div className="py-3 text-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 flex-shrink-0"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: '#3b82f6',
                }}
              >
                <MailCheck size={32} className="flex-shrink-0" />
              </div>

              <h2 className="fw-bold fs-5 text-primary-emphasis mb-2">
                Verify Your Email Address
              </h2>

              <p className="text-muted text-xs mb-3" style={{ lineHeight: 1.5 }}>
                We have dispatched an activation link to:
              </p>

              <div className="p-2.5 rounded-2 bg-subtle border font-monospace text-xs text-primary fw-semibold mb-3 text-truncate">
                {emailSentTo}
              </div>

              <p className="text-muted text-xs mb-4" style={{ lineHeight: 1.5 }}>
                Please check your inbox (and spam folder) and click the verification link to activate your workspace.
              </p>

              <div className="d-flex flex-column gap-2">
                <Link
                  to="/login"
                  className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight size={15} className="flex-shrink-0" />
                </Link>
                <button
                  type="button"
                  className="btn-ui btn-ui-ghost w-100 justify-content-center py-2"
                  onClick={() => setEmailSentTo(null)}
                >
                  <span className="text-xs">Re-enter Registration Details</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert-ui alert-danger mb-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-grow-1 text-xs" style={{ minWidth: 0 }}>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="form-group-ui mb-3">
                  <label className="form-label-ui mb-1.5" htmlFor="reg-name">
                    Full Name
                  </label>
                  <div className="position-relative">
                    <input
                      id="reg-name"
                      type="text"
                      className="form-input-ui"
                      placeholder="e.g. Sarah Khan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="form-group-ui mb-3">
                  <label className="form-label-ui mb-1.5" htmlFor="reg-email">
                    Work Email
                  </label>
                  <div className="position-relative">
                    <input
                      id="reg-email"
                      type="email"
                      className="form-input-ui"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password & Security Strength Meter */}
                <div className="form-group-ui mb-3.5">
                  <label className="form-label-ui mb-1.5" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input-ui"
                      style={{ paddingRight: '2.75rem' }}
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none d-flex align-items-center justify-content-center"
                      style={{ zIndex: 5, padding: '0.4rem 0.75rem' }}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={15} className="flex-shrink-0" />
                      ) : (
                        <Eye size={15} className="flex-shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Password Security Strength Box: Theme-Aware & Spacious */}
                  {formData.password && (
                    <div
                      className="rounded-2 border transition-all"
                      style={{
                        marginTop: '0.75rem',
                        marginBottom: '0.25rem',
                        padding: '0.85rem 1rem',
                        backgroundColor: 'var(--color-bg-subtle, rgba(255, 255, 255, 0.03))',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      {/* Header row with Strength Score Badge */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
                          Password Strength:
                        </span>
                        <span
                          className="font-monospace px-2.5 py-0.5 rounded-pill flex-shrink-0 fw-semibold"
                          style={{
                            fontSize: '0.68rem',
                            ...strengthMeta.badgeStyle,
                          }}
                        >
                          {strengthMeta.label}
                        </span>
                      </div>

                      {/* 4-Segment Strength Meter Bar */}
                      <div className="d-flex gap-1.5 mb-2.5" style={{ height: '5px' }}>
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className="flex-grow-1 rounded-pill"
                            style={{
                              height: '100%',
                              backgroundColor: strengthScore >= seg ? strengthMeta.color : 'var(--color-border)',
                              transition: 'background-color 0.25s ease',
                            }}
                          />
                        ))}
                      </div>

                      {/* Interactive Security Checklist */}
                      <div
                        className="d-grid pt-2"
                        style={{
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          rowGap: '0.45rem',
                          columnGap: '0.85rem',
                          borderTop: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          className="d-flex align-items-center gap-1.5"
                          style={{
                            minWidth: 0,
                            color: criteria.length ? '#34d399' : 'var(--color-text-secondary)',
                            opacity: criteria.length ? 1 : 0.65,
                          }}
                        >
                          {criteria.length ? (
                            <Check size={13} className="flex-shrink-0" style={{ color: '#34d399' }} />
                          ) : (
                            <div
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: '8px', height: '8px', opacity: 0.5 }}
                            />
                          )}
                          <span className="text-truncate fw-medium" style={{ fontSize: '0.7rem' }}>
                            8+ characters
                          </span>
                        </div>

                        <div
                          className="d-flex align-items-center gap-1.5"
                          style={{
                            minWidth: 0,
                            color: criteria.hasUpperLower ? '#34d399' : 'var(--color-text-secondary)',
                            opacity: criteria.hasUpperLower ? 1 : 0.65,
                          }}
                        >
                          {criteria.hasUpperLower ? (
                            <Check size={13} className="flex-shrink-0" style={{ color: '#34d399' }} />
                          ) : (
                            <div
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: '8px', height: '8px', opacity: 0.5 }}
                            />
                          )}
                          <span className="text-truncate fw-medium" style={{ fontSize: '0.7rem' }}>
                            Upper &amp; lowercase
                          </span>
                        </div>

                        <div
                          className="d-flex align-items-center gap-1.5"
                          style={{
                            minWidth: 0,
                            color: criteria.hasNumber ? '#34d399' : 'var(--color-text-secondary)',
                            opacity: criteria.hasNumber ? 1 : 0.65,
                          }}
                        >
                          {criteria.hasNumber ? (
                            <Check size={13} className="flex-shrink-0" style={{ color: '#34d399' }} />
                          ) : (
                            <div
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: '8px', height: '8px', opacity: 0.5 }}
                            />
                          )}
                          <span className="text-truncate fw-medium" style={{ fontSize: '0.7rem' }}>
                            At least 1 number
                          </span>
                        </div>

                        <div
                          className="d-flex align-items-center gap-1.5"
                          style={{
                            minWidth: 0,
                            color: criteria.hasSpecial ? '#34d399' : 'var(--color-text-secondary)',
                            opacity: criteria.hasSpecial ? 1 : 0.65,
                          }}
                        >
                          {criteria.hasSpecial ? (
                            <Check size={13} className="flex-shrink-0" style={{ color: '#34d399' }} />
                          ) : (
                            <div
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: '8px', height: '8px', opacity: 0.5 }}
                            />
                          )}
                          <span className="text-truncate fw-medium" style={{ fontSize: '0.7rem' }}>
                            Special symbol (@$!%*)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group-ui mb-3.5">
                  <label className="form-label-ui mb-1.5" htmlFor="reg-confirm-password">
                    Confirm Password
                  </label>
                  <div className="position-relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input-ui"
                      style={{ paddingRight: '2.75rem' }}
                      placeholder="Repeat your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none d-flex align-items-center justify-content-center"
                      style={{ zIndex: 5, padding: '0.4rem 0.75rem' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} className="flex-shrink-0" />
                      ) : (
                        <Eye size={15} className="flex-shrink-0" />
                      )}
                    </button>
                  </div>

                  {/* Password Match Status Indicator */}
                  {passwordsMatch && (
                    <div className="d-flex align-items-center gap-1.5 mt-1.5" style={{ fontSize: '0.72rem', color: '#34d399' }}>
                      <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: '#34d399' }} />
                      <span className="fw-medium">Passwords match</span>
                    </div>
                  )}
                  {passwordsMismatch && (
                    <div className="d-flex align-items-center gap-1.5 mt-1.5" style={{ fontSize: '0.72rem', color: '#f87171' }}>
                      <AlertCircle size={13} className="flex-shrink-0" style={{ color: '#f87171' }} />
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>

                {/* Terms of Service Checkbox */}
                <div className="d-flex align-items-start gap-2 mb-3.5">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0.5 flex-shrink-0 cursor-pointer"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    id="agree-terms"
                  />
                  <label
                    htmlFor="agree-terms"
                    className="text-xs text-secondary cursor-pointer mb-0"
                    style={{ lineHeight: 1.4, userSelect: 'none' }}
                  >
                    I agree to the{' '}
                    <Link to="#" className="text-primary text-decoration-none">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="#" className="text-primary text-decoration-none">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2 mb-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm flex-shrink-0" role="status" />
                      <span>Provisioning Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={15} className="flex-shrink-0" />
                    </>
                  )}
                </button>
              </form>

              {/* Social Registration Divider: Uncollapsible Spacing */}
              <div className="d-flex align-items-center" style={{ margin: '1.35rem 0 1.15rem' }}>
                <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
                <span
                  className="px-3 text-muted text-xs text-uppercase fw-semibold flex-shrink-0"
                  style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}
                >
                  or continue with
                </span>
                <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
              </div>

              {/* Google 1-Click Sign-Up */}
              <GoogleSignInButton text="Continue with Google" />

              <div className="text-center mt-4 pt-3.5 border-top">
                <span className="text-muted text-xs">Already have an account? </span>
                <Link
                  to="/login"
                  className="text-xs fw-semibold text-primary text-decoration-none"
                >
                  Sign In to Workspace
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="text-center">
          <p className="text-muted text-xs mb-3">
            By creating an account, you'll get access to our full suite of advertising tools
          </p>

          <div className="d-flex align-items-center justify-content-center gap-4 text-muted text-xs">
            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
              <ShieldCheck size={14} className="text-success flex-shrink-0" />
              <span>256-Bit SSL</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
              <Sparkles size={14} className="text-primary flex-shrink-0" />
              <span>Enterprise Ready</span>
            </div>
            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
              <CheckCircle2 size={14} className="text-info flex-shrink-0" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;