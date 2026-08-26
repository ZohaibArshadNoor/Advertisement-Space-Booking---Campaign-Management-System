import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForbiddenPage = () => {
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center min-vh-50">
      <div className="p-3 rounded-circle bg-danger-subtle text-danger mb-3">
        <ShieldAlert size={42} />
      </div>
      <h1 className="fw-bold fs-4 text-primary-emphasis mb-2">
        403 - Restricted Access Area
      </h1>
      <p className="text-muted text-xs max-w-md mx-auto mb-4" style={{ maxWidth: '440px' }}>
        Your account role (<strong className="text-primary-emphasis">{user?.role || 'Guest'}</strong>) is not authorized to access this module or administrative action.
      </p>

      <div className="d-flex gap-2">
        <Link to="/dashboard" className="btn-ui btn-ui-primary btn-ui-sm">
          <LayoutDashboard size={14} />
          <span>Return to Dashboard</span>
        </Link>
        <Link to="/profile" className="btn-ui btn-ui-secondary btn-ui-sm">
          <ArrowLeft size={14} />
          <span>View My Permissions</span>
        </Link>
      </div>
    </div>
  );
};

export default ForbiddenPage;
