import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, LayoutDashboard, Search } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center min-vh-50">
      <div className="p-3 rounded-circle bg-subtle text-muted mb-3 border">
        <FileQuestion size={42} />
      </div>
      <h1 className="fw-bold fs-4 text-primary-emphasis mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-muted text-xs max-w-md mx-auto mb-4" style={{ maxWidth: '440px' }}>
        The requested URL or record route does not exist or has been relocated within the system.
      </p>

      <div className="d-flex gap-2">
        <Link to="/dashboard" className="btn-ui btn-ui-primary btn-ui-sm">
          <LayoutDashboard size={14} />
          <span>Go to Dashboard</span>
        </Link>
        <Link to="/spaces" className="btn-ui btn-ui-secondary btn-ui-sm">
          <Search size={14} />
          <span>Browse Ad Spaces</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
