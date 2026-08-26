import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div className="modal-backdrop-ui" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-dialog-ui ${sizeClass}`} role="dialog" aria-modal="true">
        <div className="modal-header-ui">
          <div>
            <h3 className="modal-title-ui">{title}</h3>
            {subtitle && <p className="text-muted small mb-0 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn-ui-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-ui">{children}</div>

        {footer && <div className="modal-footer-ui">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
