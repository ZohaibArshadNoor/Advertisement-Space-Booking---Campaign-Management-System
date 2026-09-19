import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: 'var(--color-bg-base, #f8fafc)' }}>
          <div
            className="p-4 p-md-5 rounded-4 border shadow-sm text-center"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--color-bg-surface, #ffffff)',
              borderColor: 'var(--color-border, #e2e8f0)'
            }}
          >
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}
            >
              <AlertTriangle size={36} />
            </div>

            <h3 className="h5 fw-bold text-dark mb-2">Application Interface Notice</h3>
            <p className="text-muted small mb-4" style={{ lineHeight: '1.6' }}>
              A view rendering error was safely intercepted to protect your session. You can refresh this view or return to the main dashboard.
            </p>

            <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2"
                onClick={this.handleReload}
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2"
                onClick={this.handleGoHome}
              >
                <Home size={14} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
