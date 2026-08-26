import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';
import { CheckCircle2, AlertCircle, ArrowRight, MailCheck } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token was provided in the link. Please check your email URL.');
      return;
    }

    let isMounted = true;

    const verify = async () => {
      try {
        const res = await axios.post('/api/auth/verify-email', { token });
        if (isMounted) {
          if (res.data?.access_token && res.data?.user) {
            loginWithToken(res.data.access_token, res.data.user);
            if (res.data.refresh_token) {
              localStorage.setItem('refresh_token', res.data.refresh_token);
            }
          }
          setStatus('success');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setErrorMsg(
            err.response?.data?.error ||
            err.response?.data?.message ||
            'The verification link is invalid or has expired (valid for 24 hours).'
          );
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center py-5 pt-5 mt-4" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      <PublicNavbar />
      <div className="container" style={{ maxWidth: '480px', marginTop: '40px' }}>
        <div className="card-enterprise p-4 p-md-5 text-center shadow-md">
          {status === 'verifying' && (
            <div className="py-4">
              <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status" />
              <h2 className="fw-bold fs-5 text-primary-emphasis mb-1">Verifying Your Account</h2>
              <p className="text-muted text-xs mb-0">Please wait a moment while we validate your email credentials...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '64px', height: '64px', backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 className="fw-bold fs-5 text-primary-emphasis mb-1">Email Verified Successfully!</h2>
              <p className="text-muted text-xs mb-4" style={{ lineHeight: 1.5 }}>
                Your email address has been confirmed and your advertiser workspace is fully activated. You are ready to book billboard inventory and launch high-impact campaigns.
              </p>
              <button
                type="button"
                className="btn-ui btn-ui-primary w-100 justify-content-center py-2.5"
                onClick={() => navigate('/dashboard')}
              >
                <span>Enter Advertiser Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
              >
                <AlertCircle size={36} />
              </div>
              <h2 className="fw-bold fs-5 text-primary-emphasis mb-1">Verification Failed</h2>
              <p className="text-danger text-xs mb-4" style={{ lineHeight: 1.5 }}>
                {errorMsg}
              </p>
              <div className="d-flex flex-column gap-2">
                <Link to="/login" className="btn-ui btn-ui-primary w-100 justify-content-center py-2">
                  <span>Sign In to Your Account</span>
                </Link>
                <Link to="/register" className="btn-ui btn-ui-secondary w-100 justify-content-center py-2">
                  <span>Create New Account</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
