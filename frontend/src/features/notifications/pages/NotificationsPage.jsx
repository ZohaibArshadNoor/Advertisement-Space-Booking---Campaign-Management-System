import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../notificationsApi';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import {
  Bell,
  Megaphone,
  CalendarDays,
  CreditCard,
  Image as ImageIcon,
  Info,
  CheckCheck,
  Trash2,
  Inbox,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

const renderTypeIcon = (type) => {
  switch (type) {
    case 'CAMPAIGN':
      return <Megaphone size={16} className="text-primary" />;
    case 'BOOKING':
      return <CalendarDays size={16} className="text-success" />;
    case 'INVOICE':
    case 'PAYMENT':
      return <CreditCard size={16} className="text-warning" />;
    case 'CREATIVE':
      return <ImageIcon size={16} className="text-info" />;
    default:
      return <Info size={16} className="text-secondary" />;
  }
};

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 15 };
      if (filter === 'UNREAD') params.is_read = false;
      if (filter === 'READ') params.is_read = true;
      if (categoryFilter !== 'ALL') params.type = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const data = await notificationsApi.getNotifications(params);
      setNotifications(data.notifications || data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.notifications || []).length });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter, categoryFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      setError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setSuccessMsg('All notifications marked as read.');
      fetchNotifications();
    } catch (err) {
      setError('Failed to update notifications.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSuccessMsg('Notification deleted.');
    } catch (err) {
      setError('Failed to delete notification.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications &amp; System Alerts</h1>
          <p className="page-subtitle">
            Live operational feed of booking requests, media verification approvals, and billing notices.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={fetchNotifications}
            className="btn-ui btn-ui-secondary btn-ui-sm"
            title="Refresh stream"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-ui btn-ui-primary btn-ui-sm"
            >
              <CheckCheck size={14} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="alert-ui alert-success mb-3">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{successMsg}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            style={{ fontSize: '0.65rem' }}
            onClick={() => setSuccessMsg('')}
          />
        </div>
      )}

      {error && (
        <div className="alert-ui alert-danger mb-4">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="toolbar-ui">
        <div className="d-flex gap-1.5 flex-wrap">
          <button
            type="button"
            className={`btn-ui btn-ui-sm ${filter === 'ALL' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
            onClick={() => { setFilter('ALL'); setPage(1); }}
          >
            All
          </button>
          <button
            type="button"
            className={`btn-ui btn-ui-sm ${filter === 'UNREAD' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
            onClick={() => { setFilter('UNREAD'); setPage(1); }}
          >
            Unread Only
          </button>
          <button
            type="button"
            className={`btn-ui btn-ui-sm ${filter === 'READ' ? 'btn-ui-primary' : 'btn-ui-secondary'}`}
            onClick={() => { setFilter('READ'); setPage(1); }}
          >
            Read
          </button>
        </div>

        <div className="toolbar-filters">
          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="BOOKING">Bookings</option>
            <option value="CAMPAIGN">Campaigns</option>
            <option value="CREATIVE">Creatives</option>
            <option value="INVOICE">Invoices &amp; Billing</option>
            <option value="SYSTEM">System Alerts</option>
          </select>
        </div>
      </div>

      {/* Notifications Stream Card */}
      <div className="card-enterprise">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <p className="text-muted small mt-2">Loading notifications stream...</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You are all caught up!"
            description="There are no unread notifications or system alerts for your account."
          />
        ) : (
          <div>
            <div className="list-group list-group-flush border-0">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-3 d-flex align-items-start justify-content-between gap-3 border-bottom ${
                    !n.is_read ? 'bg-primary-subtle bg-opacity-15' : 'bg-surface'
                  }`}
                >
                  <div className="d-flex gap-3 align-items-start flex-grow-1">
                    <div className="p-2 rounded bg-subtle border flex-shrink-0 mt-0.5">
                      {renderTypeIcon(n.type)}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-0.5">
                        <h4 className="fw-bold text-xs text-primary-emphasis mb-0">
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="badge bg-primary text-xs" style={{ fontSize: '0.65rem' }}>
                            New
                          </span>
                        )}
                        <span className="badge bg-subtle text-muted border text-xs" style={{ fontSize: '0.65rem' }}>
                          {n.type || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-1">
                        {n.message}
                      </p>
                      <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
                        <Clock size={11} />
                        <span>
                          {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="btn-ui btn-ui-ghost btn-ui-sm"
                        title="Mark as read"
                      >
                        <CheckCheck size={14} className="text-primary" />
                        <span className="d-none d-md-inline text-xs">Read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="btn-ui-icon text-danger"
                      title="Delete alert"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={pagination.pages || 1}
              totalRecords={pagination.total || notifications.length}
              pageSize={15}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;