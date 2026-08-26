import React from 'react';
import Drawer from '../../../components/ui/Drawer';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Key,
  CheckCircle,
  Activity,
  XCircle,
  Shield
} from 'lucide-react';

const ROLE_PERMISSIONS_SUMMARY = {
  Administrator: [
    'User provisioning & deactivation',
    'Role & permission management',
    'System parameters & configuration',
    'Full security audit trail access',
    'Cross-module administrative control',
  ],
  Advertiser: [
    'Browse inventory & check availability',
    'Create & manage personal campaigns',
    'Submit booking requests with lock check',
    'Upload & manage creative assets',
    'View billing invoices & payment receipts',
  ],
  'Sales Executive': [
    'Create & manage client quotations',
    'Onboard new advertiser organizations',
    'Submit & review commercial bookings',
    'Inspect live inventory availability',
  ],
  'Space Manager': [
    'Create & edit billboard/LED spaces',
    'Manage rate card pricing tiers',
    'Configure maintenance blackout dates',
    'Inspect real-time screen telemetry',
  ],
  'Creative Reviewer': [
    'Review uploaded banners & videos',
    'Enforce resolution & aspect specs',
    'Approve / reject creatives with notes',
  ],
  'Finance Officer': [
    'Generate & issue invoices',
    'Reconcile bank wire & online payments',
    'Review aging reports & overdue balances',
  ],
};

export const UserDetailsDrawer = ({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onToggleStatus,
}) => {
  if (!user) return null;

  const permissions = ROLE_PERMISSIONS_SUMMARY[user.role] || ['Standard access'];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="User Account Details"
      subtitle={`System ID: #${user.id} • ${user.email}`}
      footer={
        <div className="d-flex justify-content-between w-100 align-items-center">
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm text-danger"
            onClick={() => onToggleStatus(user)}
          >
            {user.is_active ? 'Deactivate Account' : 'Activate Account'}
          </button>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-ui btn-ui-secondary btn-ui-sm"
              onClick={() => onResetPassword(user)}
            >
              <Key size={13} />
              <span>Reset Password</span>
            </button>
            <button
              type="button"
              className="btn-ui btn-ui-primary btn-ui-sm"
              onClick={() => onEdit(user)}
            >
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="d-flex flex-column gap-4">
        {/* Profile Card Summary */}
        <div className="p-3 rounded-3 bg-subtle border d-flex align-items-center gap-3">
          <div
            className="user-avatar"
            style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-grow-1">
            <h4 className="fw-bold text-sm mb-0.5 text-primary-emphasis">
              {user.name}
            </h4>
            <div className="text-muted text-xs mb-1.5">{user.email}</div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary text-xs">{user.role}</span>
              <StatusBadge status={user.is_active ? 'active' : 'inactive'} size="sm" />
            </div>
          </div>
        </div>

        {/* Identity & Account Metadata */}
        <div>
          <h5 className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-2.5">
            Account Specifications
          </h5>
          <div className="card-enterprise p-3">
            <div className="row g-3">
              <div className="col-6">
                <span className="text-muted text-xs d-block">Account ID</span>
                <span className="fw-semibold text-xs font-monospace">#{user.id}</span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Created Date</span>
                <span className="fw-semibold text-xs">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Initial Setup'}
                </span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Authentication Tier</span>
                <span className="fw-semibold text-xs text-primary">JWT Bearer (OAuth2)</span>
              </div>
              <div className="col-6">
                <span className="text-muted text-xs d-block">Account Status</span>
                <span className="fw-semibold text-xs">
                  {user.is_active ? 'Operational' : 'Disabled / Suspended'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Permissions Scope */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="text-xs fw-bold text-uppercase tracking-wider text-muted mb-0">
              Role Authority &amp; Entitlements
            </h5>
            <span className="badge bg-secondary-subtle text-secondary text-xs">
              {user.role}
            </span>
          </div>

          <div className="card-enterprise p-3">
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {permissions.map((perm, idx) => (
                <li key={idx} className="d-flex align-items-center gap-2 text-xs text-secondary">
                  <CheckCircle size={14} className="text-success flex-shrink-0" />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default UserDetailsDrawer;
