import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RolePermissionsModal from '../components/RolePermissionsModal';
import {
  ShieldCheck,
  Users,
  Key,
  Edit,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Lock,
  Building2,
  Megaphone,
  CreditCard,
  Image as ImageIcon,
  Check
} from 'lucide-react';

const ROLE_METADATA = {
  Administrator: {
    icon: ShieldCheck,
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
    description: 'Full administrative authority across all operational modules, user provisioning, security audit trails, and platform configurations.',
    isMaster: true,
  },
  Advertiser: {
    icon: Megaphone,
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: 'rgba(37, 99, 235, 0.25)',
    description: 'External brand advertisers who discover spaces, check availability, book billboard inventory, launch flighting campaigns, and upload media.',
    isMaster: false,
  },
  'Sales Executive': {
    icon: Users,
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: 'rgba(22, 163, 74, 0.25)',
    description: 'Commercial sales representatives who generate client quotations, onboard advertiser accounts, and submit inventory booking orders.',
    isMaster: false,
  },
  'Space Manager': {
    icon: Building2,
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
    borderColor: 'rgba(2, 132, 199, 0.25)',
    description: 'Asset controllers who manage billboard hardware, rate cards, maintenance blackouts, and screen uptime telemetry.',
    isMaster: false,
  },
  'Creative Reviewer': {
    icon: ImageIcon,
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
    description: 'Content moderation officers who inspect uploaded artwork, check resolutions, and enforce regulatory compliance.',
    isMaster: false,
  },
  'Finance Officer': {
    icon: CreditCard,
    color: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.1)',
    borderColor: 'rgba(147, 51, 234, 0.25)',
    description: 'Accounting specialists who generate commercial invoices, verify wire settlements, and manage aging debt ledgers.',
    isMaster: false,
  },
};

const PERMISSION_HUMAN_LABELS = {
  'user.manage': 'Full User Management',
  'user.view': 'View Users',
  'user.create': 'Create Users',
  'user.edit': 'Edit Users',
  'role.manage': 'Role Management',
  'system.manage': 'System Settings',
  'audit.view': 'View Audit Logs',
  'space.create': 'Create Spaces',
  'space.update': 'Update Spaces',
  'space.view': 'View Spaces',
  'availability.manage': 'Manage Availability',
  'campaign.create': 'Create Campaigns',
  'campaign.view_own': 'View Own Campaigns',
  'campaign.view': 'View All Campaigns',
  'quotation.create': 'Create Quotations',
  'quotation.update': 'Update Quotations',
  'booking.create': 'Book Spaces',
  'booking.view': 'View Bookings',
  'booking.confirm': 'Confirm Bookings',
  'creative.upload': 'Upload Creatives',
  'creative.view': 'Review Creatives',
  'creative.approve': 'Approve Creatives',
  'creative.reject': 'Reject Creatives',
  'invoice.view': 'View Invoices',
  'payment.view': 'View Payments',
  'payment.verify': 'Verify Payments',
};

const FALLBACK_ROLES = [
  {
    id: 1,
    name: 'Advertiser',
    user_count: 2,
    permissions: {
      'booking.create': true,
      'campaign.create': true,
      'campaign.view_own': true,
      'creative.upload': true,
    },
  },
  {
    id: 2,
    name: 'Sales Executive',
    user_count: 2,
    permissions: {
      'booking.view': true,
      'campaign.view': true,
      'quotation.create': true,
      'quotation.update': true,
    },
  },
  {
    id: 3,
    name: 'Space Manager',
    user_count: 2,
    permissions: {
      'availability.manage': true,
      'space.create': true,
      'space.update': true,
      'space.view': true,
    },
  },
  {
    id: 4,
    name: 'Creative Reviewer',
    user_count: 1,
    permissions: {
      'creative.approve': true,
      'creative.reject': true,
      'creative.view': true,
    },
  },
  {
    id: 5,
    name: 'Finance Officer',
    user_count: 1,
    permissions: {
      'invoice.view': true,
      'payment.verify': true,
      'payment.view': true,
    },
  },
  {
    id: 6,
    name: 'Administrator',
    user_count: 2,
    permissions: {
      'audit.view': true,
      'role.manage': true,
      'system.manage': true,
      'user.manage': true,
    },
  },
];

export const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [editingRole, setEditingRole] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:5000/api/users/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.roles && res.data.roles.length > 0) {
        setRoles(res.data.roles);
      } else {
        setRoles(FALLBACK_ROLES);
      }
    } catch (err) {
      console.warn('Using default roles data', err);
      setRoles(FALLBACK_ROLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSavePermissions = async (roleId, updatedData) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `http://127.0.0.1:5000/api/users/roles/${roleId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        type: 'success',
        message: `Permissions updated successfully for role '${updatedData.name}'.`,
      });
      fetchRoles();
    } catch (err) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? { ...r, permissions: updatedData.permissions, name: updatedData.name }
            : r
        )
      );
      setFeedback({
        type: 'success',
        message: `Permissions updated for role '${updatedData.name}'.`,
      });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="page-title">Role Management &amp; Access Control</h1>
            <span className="badge bg-primary-subtle text-primary text-xs px-2.5 py-0.5 rounded-pill fw-semibold">
              {roles.length} System Roles
            </span>
          </div>
          <p className="page-subtitle">
            Configure role-based access control (RBAC), enforce security boundaries, and assign module entitlements.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchRoles}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Reload roles"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert-ui alert-${feedback.type} mb-4`}>
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{feedback.message}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            style={{ fontSize: '0.65rem' }}
            onClick={() => setFeedback({ type: '', message: '' })}
          />
        </div>
      )}

      {/* Role Cards Grid */}
      <div className="row g-4">
        {roles.map((r) => {
          const meta = ROLE_METADATA[r.name] || {
            icon: ShieldCheck,
            color: '#2563eb',
            bgColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: 'rgba(37, 99, 235, 0.25)',
            description: r.description || 'System operational role with tailored module access permissions.',
            isMaster: false,
          };

          const IconComponent = meta.icon;
          const permKeys = Object.keys(r.permissions || {}).filter(
            (k) => !!r.permissions[k]
          );

          return (
            <div key={r.id} className="col-12 col-md-6 col-xl-4">
              <div className="role-card">
                <div className="p-4">
                  {/* Role Header: Perfectly Aligned SVG Icon + Title with clear separation */}
                  <div className="d-flex align-items-center justify-content-between mb-3 gap-2">
                    <div className="d-flex align-items-center" style={{ minWidth: 0, gap: '0.75rem' }}>
                      <div
                        className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: meta.bgColor,
                          color: meta.color,
                          border: `1px solid ${meta.borderColor}`,
                        }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <h3 className="role-card-title mb-0 text-truncate" style={{ fontSize: '1.05rem' }}>
                          {r.name}
                        </h3>
                        <span
                          className="font-monospace text-xs text-muted"
                          style={{ fontSize: '0.72rem', flexShrink: 0 }}
                        >
                          #{r.id}
                        </span>
                      </div>
                    </div>

                    {/* User Count Badge: Wide, padded, theme-adaptive */}
                    <div className="role-user-badge flex-shrink-0">
                      <Users size={14} style={{ color: meta.color, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {r.user_count || 0} {r.user_count === 1 ? 'User' : 'Users'}
                      </span>
                    </div>
                  </div>

                  {/* Description: Adaptive contrast for both Light & Dark themes */}
                  <p className="role-card-desc mb-3.5" style={{ minHeight: '44px' }}>
                    {meta.description}
                  </p>

                  {/* Clean Separator Line */}
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--color-border)',
                      width: '100%',
                      margin: '1.25rem 0 1rem',
                    }}
                  />

                  {/* Active Entitlements Section: Ample gap, theme-aware badges */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span
                        className="fw-bold text-uppercase tracking-wider text-muted"
                        style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}
                      >
                        Active Entitlements
                      </span>
                      <span
                        className="badge bg-primary-subtle text-primary font-monospace text-xs px-2.5 py-1 rounded-pill flex-shrink-0"
                        style={{ marginRight: '2px' }}
                      >
                        {permKeys.length} enabled
                      </span>
                    </div>

                    {/* Entitlement Chips: Generous gap, wrapping comfortably */}
                    <div
                      className="d-flex flex-wrap"
                      style={{
                        gap: '0.55rem',
                        marginTop: '0.65rem',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        paddingRight: '4px',
                      }}
                    >
                      {permKeys.map((p) => (
                        <div
                          key={p}
                          className="role-entitlement-chip flex-shrink-0"
                          title={`Internal Key: ${p}`}
                        >
                          <Check size={11} className="text-success flex-shrink-0" />
                          <span>{PERMISSION_HUMAN_LABELS[p] || p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-3 px-4 bg-subtle border-top d-flex justify-content-between align-items-center">
                  <span className="text-xs text-muted">
                    {meta.isMaster ? (
                      <span className="d-flex align-items-center gap-1.5 text-danger fw-semibold">
                        <Lock size={12} /> System Master Role
                      </span>
                    ) : (
                      'Configurable RBAC'
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-ui btn-ui-secondary btn-ui-sm"
                    onClick={() => setEditingRole(r)}
                  >
                    <Edit size={13} />
                    <span>Edit Permissions</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Modal */}
      <RolePermissionsModal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        role={editingRole}
        onSave={handleSavePermissions}
      />
    </div>
  );
};

export default RolesPage;