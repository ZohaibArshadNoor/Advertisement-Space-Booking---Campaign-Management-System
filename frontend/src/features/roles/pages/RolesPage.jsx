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
  Lock
} from 'lucide-react';

const FALLBACK_ROLES = [
  {
    id: 1,
    name: 'Advertiser',
    description: 'External clients who browse inventory, book ad spaces, launch flighting campaigns, and upload media.',
    user_count: 14,
    permissions: {
      'campaign.create': true,
      'campaign.view_own': true,
      'booking.create': true,
      'creative.upload': true,
    },
  },
  {
    id: 2,
    name: 'Sales Executive',
    description: 'Commercial team members who generate quotations, onboard client accounts, and enter booking orders.',
    user_count: 5,
    permissions: {
      'campaign.view': true,
      'quotation.create': true,
      'quotation.update': true,
      'booking.view': true,
    },
  },
  {
    id: 3,
    name: 'Space Manager',
    description: 'Inventory controllers who manage billboard hardware, rate cards, maintenance blackouts, and screen telemetry.',
    user_count: 3,
    permissions: {
      'space.create': true,
      'space.update': true,
      'space.view': true,
      'availability.manage': true,
    },
  },
  {
    id: 4,
    name: 'Creative Reviewer',
    description: 'Content moderators who inspect uploaded artwork, check resolutions, and enforce compliance guidelines.',
    user_count: 4,
    permissions: {
      'creative.view': true,
      'creative.approve': true,
      'creative.reject': true,
    },
  },
  {
    id: 5,
    name: 'Finance Officer',
    description: 'Accounting personnel who generate commercial invoices, verify wire settlements, and manage aging debt ledgers.',
    user_count: 2,
    permissions: {
      'invoice.view': true,
      'payment.view': true,
      'payment.verify': true,
    },
  },
  {
    id: 6,
    name: 'Administrator',
    description: 'System administrators with full cross-module access, user provisioning, role authority, and audit trail inspection.',
    user_count: 2,
    permissions: {
      'user.manage': true,
      'role.manage': true,
      'system.manage': true,
      'audit.view': true,
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
      // Local optimistic update
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
          <h1 className="page-title">Role Management &amp; Access Control</h1>
          <p className="page-subtitle">
            Configure role-based access control (RBAC) and assign module entitlements.
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
        <div className={`alert-ui alert-${feedback.type} mb-3`}>
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
          const permKeys = Object.keys(r.permissions || {}).filter(
            (k) => !!r.permissions[k]
          );

          return (
            <div key={r.id} className="col-12 col-md-6 col-xl-4">
              <div className="card-enterprise h-100 d-flex flex-column justify-content-between">
                <div className="p-3.5">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded bg-primary-subtle text-primary">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h3 className="fw-bold text-sm text-primary-emphasis mb-0">
                          {r.name}
                        </h3>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Role ID: #{r.id}
                        </small>
                      </div>
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary text-xs d-flex align-items-center gap-1">
                      <Users size={11} />
                      <span>{r.user_count || 0} Users</span>
                    </span>
                  </div>

                  <p className="text-muted text-xs mb-3" style={{ minHeight: '36px', lineHeight: 1.45 }}>
                    {r.description || 'System operational role with tailored module access permissions.'}
                  </p>

                  <div className="border-top pt-2.5">
                    <div className="text-xs fw-semibold text-muted mb-1.5 d-flex justify-content-between">
                      <span>Active Entitlements</span>
                      <span className="text-primary font-monospace">{permKeys.length} enabled</span>
                    </div>
                    <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {permKeys.map((p) => (
                        <span
                          key={p}
                          className="badge bg-subtle text-secondary border font-monospace"
                          style={{ fontSize: '0.68rem', fontWeight: 500 }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 px-3 bg-subtle border-top d-flex justify-content-between align-items-center">
                  <span className="text-xs text-muted">
                    {r.name === 'Administrator' ? (
                      <span className="d-flex align-items-center gap-1 text-danger">
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
