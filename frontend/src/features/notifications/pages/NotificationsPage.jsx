import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Clock,
  ExternalLink,
  ShieldAlert
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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
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
      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
      setPagination(data.pagination || { page: 1, pages: 1, total: (data.notifications || []).length });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 200);
    return () => clearTimeout(timer);
  }, [page, filter, categoryFilter, search]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (filter === 'UNREAD') {
        // If viewing unread only, re-fetch or filter out
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      setError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setSuccessMsg('All notifications marked as read.');
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      setError('Failed to update notifications.');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      const deleted = notifications.find((n) => n.id === id);
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSuccessMsg('Notification deleted.');
    } catch (err) {
      setError('Failed to delete notification.');
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header mb-4">
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
        <div className="alert-ui alert-danger mb-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          <div className="flex-grow-1 text-xs">{error}</div>
        </div>
      )}

      {/* Filter Tabs & Search Toolbar */}
      <div className="toolbar-ui mb-3.5 align-items-center">
        {/* Segmented Filter Pills */}
        <div className="d-inline-flex p-1 rounded bg-subtle border gap-1">
          <button
            type="button"
            className={`btn-ui btn-ui-xs ${filter === 'ALL' ? 'btn-ui-primary' : 'btn-ui-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => { setFilter('ALL'); setPage(1); }}
          >
            All
          </button>
          <button
            type="button"
            className={`btn-ui btn-ui-xs ${filter === 'UNREAD' ? 'btn-ui-primary' : 'btn-ui-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => { setFilter('UNREAD'); setPage(1); }}
          >
            Unread Only
            {unreadCount > 0 && (
              <span
                className={`badge ms-1.5 ${filter === 'UNREAD' ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}
                style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`btn-ui btn-ui-xs ${filter === 'READ' ? 'btn-ui-primary' : 'btn-ui-ghost'}`}
            style={{ borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => { setFilter('READ'); setPage(1); }}
          >
            Read
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="toolbar-filters ms-auto">
          <div className="toolbar-search" style={{ minWidth: '220px', maxWidth: '280px' }}>
            <Search size={14} className="toolbar-search-icon" />
            <input
              type="text"
              className="toolbar-search-input"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem 0.4rem 2rem' }}
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-select-ui"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.42rem 0.75rem' }}
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
            <option value="PAYMENT">Payments</option>
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
            icon={filter === 'UNREAD' ? CheckCheck : filter === 'READ' ? Inbox : Bell}
            title={
              filter === 'UNREAD'
                ? 'No unread notifications'
                : filter === 'READ'
                ? 'No read notifications'
                : 'No notifications found'
            }
            description={
              filter === 'UNREAD'
                ? 'You are all caught up with your latest operational alerts.'
                : filter === 'READ'
                ? 'You have not archived or read any notifications yet.'
                : 'There are currently no alerts matching your active filter criteria.'
            }
          />
        ) : (
          <div>
            <div className="list-group list-group-flush border-0">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`notification-item p-3 d-flex align-items-start justify-content-between gap-3 border-bottom ${
                    !n.is_read ? 'notification-unread' : 'notification-read'
                  }`}
                  style={{
                    cursor: n.link ? 'pointer' : 'default',
                  }}
                >
                  <div className="d-flex gap-3 align-items-start flex-grow-1">
                    <div className="p-2 rounded bg-subtle border flex-shrink-0 mt-0.5">
                      {renderTypeIcon(n.type)}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <h4 className="fw-bold text-xs text-primary-emphasis mb-0">
                          {n.title}
                        </h4>
                        {!n.is_read && (
                          <span className="badge bg-primary text-xs px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                            New
                          </span>
                        )}
                        <span className="badge bg-subtle text-muted border text-xs px-1.5 py-0.5 font-monospace" style={{ fontSize: '0.65rem' }}>
                          {n.type || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-1.5" style={{ lineHeight: 1.45 }}>
                        {n.message}
                      </p>
                      <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '0.72rem' }}>
                        <div className="d-flex align-items-center gap-1">
                          <Clock size={11} />
                          <span>
                            {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        {n.link && (
                          <span className="text-primary d-inline-flex align-items-center gap-1 fw-medium">
                            <span>Open details</span>
                            <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-2">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="btn-ui btn-ui-ghost btn-ui-sm d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Mark as read"
                      >
                        <CheckCheck size={13} className="text-primary" />
                        <span className="d-none d-sm-inline">Read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(n.id, e)}
                      className="btn-ui-icon text-danger"
                      title="Delete notification"
                      style={{ width: '28px', height: '28px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-top bg-subtle">
              <Pagination
                currentPage={page}
                totalPages={pagination.pages || 1}
                totalRecords={pagination.total || notifications.length}
                pageSize={15}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;