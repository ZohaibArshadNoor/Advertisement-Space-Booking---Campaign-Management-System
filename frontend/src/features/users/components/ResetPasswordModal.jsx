import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { Key, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  user,
  onReset,
}) => {
  const [newPassword, setNewPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onReset(user.id, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Account Password"
      subtitle={`Set a new temporary or permanent password for ${user.name} (${user.email})`}
      size="sm"
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
            onClick={handleReset}
            disabled={submitting || success}
          >
            {submitting ? 'Resetting...' : success ? 'Password Updated!' : 'Apply New Password'}
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

      {success && (
        <div className="alert-ui alert-success mb-3">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">
            Password has been reset successfully.
          </div>
        </div>
      )}

      <form onSubmit={handleReset}>
        <div className="form-group-ui">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label-ui mb-0" htmlFor="reset-password-field">
              New Password
            </label>
            <button
              type="button"
              onClick={generatePassword}
              className="btn btn-link p-0 text-xs text-decoration-none d-flex align-items-center gap-1 text-primary"
            >
              <RefreshCw size={11} /> Generate
            </button>
          </div>
          <input
            id="reset-password-field"
            type="text"
            className="form-input-ui font-monospace"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={submitting || success}
          />
          <span className="form-helper-text">
            Ensure you securely communicate this new password to the user.
          </span>
        </div>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal;
