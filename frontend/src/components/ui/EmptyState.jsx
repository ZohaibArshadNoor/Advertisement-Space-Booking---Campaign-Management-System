import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) => {
  return (
    <div className={`empty-state-ui ${className}`}>
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-ui btn-ui-primary btn-ui-sm"
        >
          {ActionIcon && <ActionIcon size={14} />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
