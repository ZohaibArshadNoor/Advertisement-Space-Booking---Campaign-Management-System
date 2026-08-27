import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const GoogleSignInButton = ({ text = 'Continue with Google' }) => {
  const btnRef = useRef(null);
  const { loginWithToken } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [googleReady, setGoogleReady] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '677049361038-1pqusl52u8l68nqn0dpd0rpnnebqgtuj.apps.googleusercontent.com';

  const handleCredentialResponse = async (response) => {
    try {
      const res = await axios.post('/api/auth/google', {
        credential: response.credential,
      });

      if (res.data?.access_token) {
        loginWithToken(res.data.access_token, res.data.user);
        if (res.data.refresh_token) {
          localStorage.setItem('refresh_token', res.data.refresh_token);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Google Authentication failed. Please try again.'
      );
    }
  };

  useEffect(() => {
    if (!clientId) return;

    const setupGoogle = () => {
      if (window.google?.accounts?.id && clientId) {
        try {
          if (!window._gsiInitialized) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            window._gsiInitialized = true;
          }

          if (btnRef.current) {
            btnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(btnRef.current, {
              theme: isDark ? 'filled_black' : 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380,
            });
          }
          setGoogleReady(true);
        } catch (e) {
          // Gracefully fallback to custom branded button
          setGoogleReady(false);
        }
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setupGoogle;
      document.body.appendChild(script);
    } else {
      setupGoogle();
    }
  }, [clientId, isDark]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google authentication is loading. Please check your connection.');
    }
  };

  return (
    <div className="w-100 my-2 position-relative d-flex justify-content-center" style={{ minHeight: '42px' }}>
      {/* Native Google SDK Button Render Box */}
      <div
        ref={btnRef}
        className="w-100 d-flex justify-content-center"
        style={{ minHeight: '40px', display: googleReady ? 'flex' : 'none' }}
      />

      {/* Guaranteed Instant UI Button (Always rendered if SDK is pending) */}
      {!googleReady && (
        <button
          type="button"
          onClick={handleCustomClick}
          className="btn-ui btn-ui-secondary w-100 justify-content-center py-2.5 d-flex align-items-center gap-2.5 text-decoration-none"
          style={{
            fontWeight: 500,
            fontSize: '0.875rem',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#1e293b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="fw-medium">Continue with Google</span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;