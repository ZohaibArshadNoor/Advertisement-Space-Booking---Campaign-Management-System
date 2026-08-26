import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../features/auth/authApi';
import PublicNavbar from '../components/PublicNavbar';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Layers,
  Users,
  CheckCircle2
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@test.com', name: 'System Administrator', desc: 'Full system & user access' },
  { role: 'Space Manager', email: 'spaces@test.com', name: 'Space Manager', desc: 'Manage inventory & schedules' },
  { role: 'Sales Executive', email: 'sales@test.com', name: 'Sales Executive', desc: 'Pipeline, bookings & quotes' },
  { role: 'Creative Reviewer', email: 'reviewer@test.com', name: 'Creative Reviewer', desc: 'Approve & reject media' },
  { role: 'Finance Officer', email: 'finance@test.com', name: 'Finance Officer', desc: 'Invoices, payments & ledgers' },
  { role: 'Advertiser', email: 'advertiser@test.com', name: 'Ali Hassan (Jazz Marketing)', desc: 'Browse, book & launch' },
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demo) => {
    setEmail(demo.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center py-5" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <PublicNavbar />
      <div className="container" style={{ maxWidth: '460px', marginTop: '70px', marginBottom: '40px' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2.5 mb-2">
            <div className="brand-icon-box flex-shrink-0" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
              AD
            </div>
            <span className="fw-bold fs-4 text-primary-emphasis" style={{ letterSpacing: '-0.02em' }}>
              AdFlow
            </span>
          </div>
          <h1 className="fw-bold fs-5 text-primary-emphasis mb-1">
            Enterprise Sign In
          </h1>
          <p className="text-muted small mb-0">
            Sign in to access your advertising workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="card-enterprise p-4 mb-4 shadow-md">
          {error && (
            <div className="alert-ui alert-danger mb-3">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs" style={{ minWidth: 0 }}>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-ui mb-3">
              <label className="form-label-ui mb-1.5" htmlFor="login-email">
                Work Email
              </label>
              <div className="position-relative">
                <input
                  id="login-email"
                  type="email"
                  className="form-input-ui"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group-ui mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <label className="form-label-ui mb-0" htmlFor="login-password">
                  Password
                </label>
                <Link to="#" className="text-xs text-primary text-decoration-none">
                  Forgot password?
                </Link>
              </div>
              <div className="position-relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-ui"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none d-flex align-items-center justify-content-center"
                  style={{ zIndex: 5, padding: '0.4rem 0.75rem' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} className="flex-shrink-0" /> : <Eye size={15} className="flex-shrink-0" />}
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <label className="d-flex align-items-center gap-2 cursor-pointer mb-0">
                <input
                  type="checkbox"
                  className="form-check-input mt-0 flex-shrink-0"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs text-secondary">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2 mb-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm flex-shrink-0" role="status" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={15} className="flex-shrink-0" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign In Divider: Generous clearance */}
          <div className="d-flex align-items-center" style={{ margin: '1.35rem 0 1.15rem' }}>
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span className="px-3 text-muted text-xs text-uppercase fw-semibold flex-shrink-0" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>
              or continue with
            </span>
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* Google One-Tap & Button Sign In */}
          <GoogleSignInButton text="Continue with Google" />

          {/* Quick Demo Impersonation Switcher */}
          <div className="border-top mt-4 pt-3.5">
            <div className="d-flex align-items-center justify-content-between mb-2.5">
              <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">
                Demo Accounts Quick-Fill
              </span>
              <span className="badge bg-primary-subtle text-primary text-xs flex-shrink-0">
                1-Click Select
              </span>
            </div>

            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleQuickFill(demo)}
                  className="btn-ui btn-ui-secondary btn-ui-sm text-start justify-content-start py-2 px-2.5 d-flex align-items-center gap-2"
                  title={`Fill credentials for ${demo.name}`}
                  style={{ minWidth: 0 }}
                >
                  <ShieldCheck size={14} className="text-primary flex-shrink-0" />
                  <span className="text-truncate" style={{ fontSize: '0.72rem', minWidth: 0 }}>
                    {demo.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-muted text-xs mb-3">
            Need an advertiser account?{' '}
            <Link to="/register" className="text-primary fw-semibold text-decoration-none">
              Register as Advertiser
            </Link>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
