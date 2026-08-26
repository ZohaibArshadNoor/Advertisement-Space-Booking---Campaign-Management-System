import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { AlertCircle, Key, RefreshCw } from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 1, name: 'Advertiser', description: 'Can book spaces, manage own campaigns & upload creatives' },
  { id: 2, name: 'Sales Executive', description: 'Can create quotations, manage advertiser accounts & book inventory' },
  { id: 3, name: 'Space Manager', description: 'Can manage spaces, locations, rate cards & maintenance schedules' },
  { id: 4, name: 'Creative Reviewer', description: 'Can inspect, verify, approve & reject advertising artwork' },
  { id: 5, name: 'Finance Officer', description: 'Can generate invoices, track payments & view billing ledgers' },
  { id: 6, name: 'Administrator', description: 'Full system management, user provisioning & audit trails' },
];

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 1,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initialData && isEditing) {
      const selectedRole = ROLE_OPTIONS.find((r) => r.name === initialData.role) || ROLE_OPTIONS[0];
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '',
        role_id: selectedRole.id,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: 'Password123!',
        role_id: 1,
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError('');
  }, [initialData, isEditing, isOpen]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!isEditing && !formData.password) {
      newErrors.password = 'Initial password is required for new accounts.';
    } else if (!isEditing && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('User submit error', err);
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Failed to save user account. Please check field inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoleObj = ROLE_OPTIONS.find((r) => r.id === Number(formData.role_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Account' : 'Provision New User'}
      subtitle={isEditing ? `Updating permissions and account info for ${initialData?.name}` : 'Create an internal staff or advertiser user record'}
      size="md"
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
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
          </button>
        </>
      }
    >
      {submitError && (
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={15} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group-ui">
          <label className="form-label-ui" htmlFor="user-name">
            Full Name <span className="form-required">*</span>
          </label>
          <input
            id="user-name"
            type="text"
            className={`form-input-ui ${errors.name ? 'has-error' : ''}`}
            placeholder="e.g. Sarah Khan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          {errors.name && <span className="form-error-msg">{errors.name}</span>}
        </div>

        <div className="form-group-ui">
          <label className="form-label-ui" htmlFor="user-email">
            Work Email Address <span className="form-required">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            className={`form-input-ui ${errors.email ? 'has-error' : ''}`}
            placeholder="e.g. sarah.khan@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {errors.email && <span className="form-error-msg">{errors.email}</span>}
        </div>

        {!isEditing && (
          <div className="form-group-ui">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label-ui mb-0" htmlFor="user-password">
                Initial Password <span className="form-required">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="btn btn-link p-0 text-xs text-decoration-none d-flex align-items-center gap-1 text-primary"
              >
                <RefreshCw size={11} /> Generate
              </button>
            </div>
            <input
              id="user-password"
              type="text"
              className={`form-input-ui ${errors.password ? 'has-error' : ''}`}
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            {errors.password && <span className="form-error-msg">{errors.password}</span>}
            <span className="form-helper-text">
              The user can update this password from their profile once logged in.
            </span>
          </div>
        )}

        <div className="form-group-ui">
          <label className="form-label-ui" htmlFor="user-role">
            Assigned Role &amp; Access Tier <span className="form-required">*</span>
          </label>
          <select
            id="user-role"
            className="form-select-ui"
            value={formData.role_id}
            onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {selectedRoleObj && (
            <div className="mt-1.5 p-2 rounded bg-subtle border text-xs text-muted">
              <strong className="text-primary-emphasis">{selectedRoleObj.name}:</strong> {selectedRoleObj.description}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
