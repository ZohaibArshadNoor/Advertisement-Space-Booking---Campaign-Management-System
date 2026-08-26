import React from 'react';

const STATUS_CONFIGS = {
  // Active / Success states
  active: { label: 'Active', className: 'status-active' },
  confirmed: { label: 'Confirmed', className: 'status-confirmed' },
  verified: { label: 'Verified', className: 'status-verified' },
  approved: { label: 'Approved', className: 'status-approved' },
  completed: { label: 'Completed', className: 'status-active' },
  paid: { label: 'Paid', className: 'status-active' },

  // Pending / Warning states
  pending: { label: 'Pending', className: 'status-pending' },
  review: { label: 'In Review', className: 'status-review' },
  draft: { label: 'Draft', className: 'status-draft' },
  scheduled: { label: 'Scheduled', className: 'status-info' },
  maintenance: { label: 'Maintenance', className: 'status-warning' },
  partially_paid: { label: 'Partially Paid', className: 'status-warning' },

  // Danger / Inactive states
  inactive: { label: 'Inactive', className: 'status-inactive' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
  rejected: { label: 'Rejected', className: 'status-rejected' },
  overdue: { label: 'Overdue', className: 'status-overdue' },
  expired: { label: 'Expired', className: 'status-inactive' },
  occupied: { label: 'Occupied', className: 'status-confirmed' },
  available: { label: 'Available', className: 'status-active' },
};

export const StatusBadge = ({ status, labelOverride, size = 'md' }) => {
  if (status === null || status === undefined) return null;

  const key = String(status).toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIGS[key] || {
    label: String(status),
    className: 'status-info',
  };

  const displayText = labelOverride || config.label;

  return (
    <span className={`status-pill ${config.className} ${size === 'sm' ? 'py-0.5 px-2 text-xs' : ''}`}>
      <span className="status-dot" />
      <span>{displayText}</span>
    </span>
  );
};

export default StatusBadge;
