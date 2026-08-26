import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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

    setLoading(true);
    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
      }
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        setError(Object.values(backendErrors).flat().join(', '));
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center py-5 pt-5 mt-4" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <PublicNavbar />
      <div className="container" style={{ maxWidth: '480px', marginTop: '40px' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <div className="brand-icon-box" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
              AD
            </div>
            <span className="fw-bold fs-4 text-primary-emphasis" style={{ letterSpacing: '-0.02em' }}>
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

        {/* Registration Card */}
        <div className="card-enterprise p-4 mb-4 shadow-md">
          {error && (
            <div className="alert-ui alert-danger mb-3">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-grow-1 text-xs">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="reg-name">
                Full Name <span className="form-required">*</span>
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
                  required
                />
              </div>
            </div>

            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="reg-email">
                Work Email Address <span className="form-required">*</span>
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
                  required
                />
              </div>
            </div>

            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="reg-password">
                Password <span className="form-required">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-ui"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="btn-ui-icon position-absolute end-0 top-50 translate-middle-y me-1"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group-ui">
              <label className="form-label-ui" htmlFor="reg-confirm-password">
                Confirm Password <span className="form-required">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input-ui"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="btn-ui-icon position-absolute end-0 top-50 translate-middle-y me-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-3 pt-3 border-top">
            <span className="text-muted text-xs">Already have an account? </span>
            <Link to="/login" className="text-xs fw-semibold text-primary text-decoration-none">
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="d-flex items-center justify-content-center gap-4 text-muted text-xs">
          <div className="d-flex align-items-center gap-1.5">
            <ShieldCheck size={14} className="text-success" />
            <span>256-Bit SSL Encryption</span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            <span>Instant Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
