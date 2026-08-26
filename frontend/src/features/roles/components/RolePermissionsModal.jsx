import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { ShieldCheck, Check, AlertCircle } from 'lucide-react';

const PERMISSION_MODULES = [
  {
    module: 'User Management',
    description: 'Control user provisioning, status toggles, and role assignments',
    permissions: [
      { key: 'user.manage', label: 'Full User Management', description: 'Create, update, deactivate and delete any user' },
      { key: 'user.view', label: 'View Users List', description: 'Browse active and inactive user records' },
      { key: 'user.create', label: 'Create Users', description: 'Provision new staff or client accounts' },
      { key: 'user.edit', label: 'Edit Users', description: 'Update profile details and role associations' },
    ],
  },
  {
    module: 'Advertising Spaces & Inventory',
    description: 'Manage billboard assets, locations, rate cards, and blackout schedules',
    permissions: [
      { key: 'space.view', label: 'View Spaces', description: 'Browse and inspect billboard and screen specifications' },
      { key: 'space.create', label: 'Create Spaces', description: 'Register new digital LEDs, unipoles, and kiosks' },
      { key: 'space.update', label: 'Update Spaces', description: 'Modify dimensions, rates, and operational parameters' },
      { key: 'availability.manage', label: 'Manage Availability', description: 'Set blackout dates and maintenance windows' },
    ],
  },
  {
    module: 'Campaigns & Commercial Pipelines',
    description: 'Oversee advertiser campaigns, target schedules, and performance tracking',
    permissions: [
      { key: 'campaign.view', label: 'View All Campaigns', description: 'Inspect cross-advertiser media campaigns' },
      { key: 'campaign.view_own', label: 'View Own Campaigns', description: 'Access only self-created advertiser campaigns' },
      { key: 'campaign.create', label: 'Create Campaign', description: 'Launch new media flighting schedules' },
      { key: 'quotation.create', label: 'Create Quotations', description: 'Generate formal commercial rate proposals' },
    ],
  },
  {
    module: 'Bookings & Collision Prevention',
    description: 'Submit reservations with pessimistic locking and confirm schedules',
    permissions: [
      { key: 'booking.view', label: 'View Bookings', description: 'Inspect booking schedule ledger and time slots' },
      { key: 'booking.create', label: 'Create Bookings', description: 'Reserve dates with conflict-free collision checks' },
      { key: 'booking.confirm', label: 'Confirm Bookings', description: 'Authorize and lock space reservations' },
    ],
  },
  {
    module: 'Creative Media Review & Compliance',
    description: 'Inspect artwork, verify technical specifications, and approve broadcasts',
    permissions: [
      { key: 'creative.upload', label: 'Upload Creatives', description: 'Submit high-res images and video reels' },
      { key: 'creative.view', label: 'Review Media Queue', description: 'Inspect submitted creative assets' },
      { key: 'creative.approve', label: 'Approve Creatives', description: 'Clear artwork for live screen broadcast' },
      { key: 'creative.reject', label: 'Reject Creatives', description: 'Flag violations and request revisions' },
    ],
  },
  {
    module: 'Invoices, Billing & Payments',
    description: 'Generate client invoices, track wire receipts, and manage accounts',
    permissions: [
      { key: 'invoice.view', label: 'View Invoices', description: 'Access billing ledger and tax invoices' },
      { key: 'payment.view', label: 'View Payments', description: 'Inspect incoming bank wire and card transactions' },
      { key: 'payment.verify', label: 'Verify Payments', description: 'Confirm settlement and reconcile balances' },
    ],
  },
  {
    module: 'System & Security Audit',
    description: 'Access immutable system logs, configurations, and administrative tools',
    permissions: [
      { key: 'audit.view', label: 'View Audit Logs', description: 'Inspect security events, actor IPs, and diffs' },
      { key: 'system.manage', label: 'System Configuration', description: 'Adjust platform parameters and timeouts' },
      { key: 'role.manage', label: 'Manage Roles', description: 'Configure role permission assignments' },
    ],
  },
];

export const RolePermissionsModal = ({
  isOpen,
  onClose,
  role,
  onSave,
}) => {
  const [permissions, setPermissions] = useState({});
  const [roleName, setRoleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setPermissions(role.permissions || {});
      setRoleName(role.name || '');
    } else {
      setPermissions({});
      setRoleName('');
    }
    setError('');
  }, [role, isOpen]);

  const togglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleModuleAll = (modulePerms, enable) => {
    const next = { ...permissions };
    modulePerms.forEach((p) => {
      next[p.key] = enable;
    });
    setPermissions(next);
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onSave(role.id, {
        name: roleName,
        permissions,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!role) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Permissions: ${role.name}`}
      subtitle="Define granular access rights across operational modules"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn-ui btn-ui-secondary btn-ui-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-ui btn-ui-primary btn-ui-sm"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Permissions Matrix'}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={15} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      <div className="d-flex flex-column gap-4">
        {PERMISSION_MODULES.map((grp) => {
          const allChecked = grp.permissions.every((p) => !!permissions[p.key]);
          const someChecked = grp.permissions.some((p) => !!permissions[p.key]);

          return (
            <div key={grp.module} className="card-enterprise">
              <div className="card-header-enterprise py-2.5 px-3 bg-subtle">
                <div>
                  <h4 className="fw-bold text-xs text-primary-emphasis mb-0.5">
                    {grp.module}
                  </h4>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {grp.description}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-xs text-decoration-none text-primary"
                    onClick={() => toggleModuleAll(grp.permissions, true)}
                  >
                    Select All
                  </button>
                  <span className="text-muted text-xs">|</span>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-xs text-decoration-none text-muted"
                    onClick={() => toggleModuleAll(grp.permissions, false)}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="row g-2">
                  {grp.permissions.map((p) => {
                    const isChecked = !!permissions[p.key];
                    return (
                      <div key={p.key} className="col-12 col-md-6">
                        <label
                          className={`d-flex align-items-start gap-2.5 p-2 rounded border cursor-pointer transition-all ${
                            isChecked ? 'bg-primary-subtle border-primary-subtle' : 'bg-surface'
                          }`}
                          style={{ minHeight: '64px' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-0.5"
                            checked={isChecked}
                            onChange={() => togglePermission(p.key)}
                          />
                          <div>
                            <div className="fw-semibold text-xs text-primary-emphasis">
                              {p.label}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {p.description}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default RolePermissionsModal;
