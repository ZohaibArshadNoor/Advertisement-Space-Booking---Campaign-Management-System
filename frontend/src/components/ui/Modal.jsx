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
      <div className={`modal-dialog-ui ${sizeClass}`} role="dialog" aria-modal="true" style={{ boxSizing: 'border-box' }}>
        <div className="modal-header-ui" style={{ padding: '1.25rem 1.5rem', flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: '1 1 auto', paddingRight: '1rem' }}>
            <h3 className="modal-title-ui text-truncate" title={title}>{title}</h3>
            {subtitle && <p className="text-muted small mb-0 mt-0.5 text-truncate" title={subtitle}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn-ui-icon flex-shrink-0"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-ui" style={{ padding: '1.5rem', overflowY: 'auto', boxSizing: 'border-box' }}>{children}</div>

        {footer && <div className="modal-footer-ui" style={{ padding: '1rem 1.5rem', flexShrink: 0, boxSizing: 'border-box' }}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
