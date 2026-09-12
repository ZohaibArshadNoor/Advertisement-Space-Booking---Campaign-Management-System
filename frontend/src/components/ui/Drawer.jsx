import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
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

  const sizeClass = size === 'lg' ? 'drawer-lg' : size === 'xl' ? 'drawer-xl' : '';

  return (
    <div className="drawer-backdrop-ui" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`drawer-panel-ui ${sizeClass}`} role="dialog" aria-modal="true" style={{ boxSizing: 'border-box' }}>
        <div className="modal-header-ui">
          <div style={{ minWidth: 0, flex: '1 1 auto', paddingRight: '0.75rem' }}>
            <h3 className="modal-title-ui text-truncate" title={title}>{title}</h3>
            {subtitle && <p className="text-muted small mb-0 mt-1 text-truncate" title={subtitle}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn-ui-icon flex-shrink-0"
            onClick={onClose}
            aria-label="Close drawer"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-ui" style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>

        {footer && <div className="modal-footer-ui">{footer}</div>}
      </div>
    </div>
  );
};

export default Drawer;
