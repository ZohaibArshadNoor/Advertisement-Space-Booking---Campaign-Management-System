import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, Info, CheckCircle2, X } from 'lucide-react';

/**
 * Enterprise SweetAlert-styled Confirmation Dialog
 */
export const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  itemName,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 size={32} className="text-danger" />,
          bgClass: 'bg-danger-subtle border-danger-subtle',
          btnClass: 'btn-ui btn-ui-danger',
          ringColor: 'rgba(239, 68, 68, 0.2)',
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={32} className="text-success" />,
          bgClass: 'bg-success-subtle border-success-subtle',
          btnClass: 'btn-ui btn-ui-primary',
          ringColor: 'rgba(34, 197, 94, 0.2)',
        };
      case 'info':
        return {
          icon: <Info size={32} className="text-primary" />,
          bgClass: 'bg-primary-subtle border-primary-subtle',
          btnClass: 'btn-ui btn-ui-primary',
          ringColor: 'rgba(59, 130, 246, 0.2)',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle size={32} className="text-warning" />,
          bgClass: 'bg-warning-subtle border-warning-subtle',
          btnClass: 'btn-ui btn-ui-danger',
          ringColor: 'rgba(245, 158, 11, 0.2)',
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      className="modal-backdrop-ui d-flex align-items-center justify-content-center"
      style={{
        zIndex: 10050,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="sweetalert-card border shadow-xl rounded-4 position-relative"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          padding: '2.25rem 2rem 2rem 2rem',
          boxSizing: 'border-box',
          margin: '1rem',
          animation: 'sweetalert-pop 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn-ui-icon position-absolute top-0 end-0 m-3.5"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          style={{ width: '30px', height: '30px' }}
        >
          <X size={16} />
        </button>

        {/* Structured Column with Explicit Gaps (Zero Overlap Guaranteed) */}
        <div className="d-flex flex-column align-items-center text-center w-100" style={{ gap: '1.25rem' }}>
          
          {/* 1. Animated Icon Circle */}
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center border ${config.bgClass} flex-shrink-0`}
            style={{
              width: '72px',
              height: '72px',
              boxShadow: `0 0 0 8px ${config.ringColor}`,
            }}
          >
            {config.icon}
          </div>

          {/* 2. Dialog Title & Target Item Section */}
          <div className="d-flex flex-column align-items-center w-100 px-1" style={{ gap: '0.75rem' }}>
            <h4
              id="confirm-dialog-title"
              className="fw-bold text-primary-emphasis mb-0"
              style={{ fontSize: '1.2rem', letterSpacing: '-0.01em', lineHeight: '1.35' }}
            >
              {title}
            </h4>

            {itemName && (
              <div className="w-100 d-flex justify-content-center">
                <span
                  className="badge bg-secondary-subtle text-primary-emphasis border px-3 py-1.5 text-xs text-wrap d-inline-block font-monospace"
                  style={{
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    lineHeight: '1.45',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {itemName}
                </span>
              </div>
            )}
          </div>

          {/* 3. Descriptive Message */}
          <p
            className="text-secondary text-xs mb-0 px-2"
            style={{
              fontSize: '0.86rem',
              lineHeight: '1.55',
              color: 'var(--color-text-secondary)',
            }}
          >
            {message}
          </p>

          {/* 4. Action Buttons */}
          <div className="d-flex align-items-center justify-content-center gap-3 w-100 pt-1" style={{ boxSizing: 'border-box' }}>
            <button
              type="button"
              className="btn-ui btn-ui-secondary flex-grow-1"
              style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem' }}
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`${confirmButtonClass || config.btnClass} flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1.5`}
              style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem' }}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
