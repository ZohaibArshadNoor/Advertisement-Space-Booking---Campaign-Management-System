import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
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

  return (
    <div className="drawer-backdrop-ui" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer-panel-ui" role="dialog" aria-modal="true">
        <div className="modal-header-ui">
          <div>
            <h3 className="modal-title-ui">{title}</h3>
            {subtitle && <p className="text-muted small mb-0 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn-ui-icon"
            onClick={onClose}
            aria-label="Close drawer"
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

export default Drawer;
