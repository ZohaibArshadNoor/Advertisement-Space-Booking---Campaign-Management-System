import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../notificationsApi';
import { 
  Bell, 
  Megaphone, 
  CalendarDays, 
  CreditCard, 
  Image as ImageIcon, 
  Info, 
  CheckCheck, 
  Trash2,
  Inbox
} from 'lucide-react';

const renderTypeIcon = (type) => {
  switch (type) {
    case 'CAMPAIGN':
      return <Megaphone size={22} className="text-primary" />;
    case 'BOOKING':
      return <CalendarDays size={22} className="text-success" />;
    case 'INVOICE':
      return <CreditCard size={22} className="text-warning" />;
    case 'CREATIVE':
      return <ImageIcon size={22} className="text-info" />;
    default:
      return <Info size={22} className="text-secondary" />;
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, per_page: 12 };
      if (filter === 'UNREAD') params.is_read = false;
      if (filter === 'READ') params.is_read = true;

      const data = await notificationsApi.getNotifications(params);
      setNotifications(data.notifications || data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

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

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Bell className="text-primary" size={28} />
            Notifications & System Alerts
          </h2>
          <p className="text-muted small mb-0">Track real-time workflow events, media reviews, and billing notices</p>
        </div>
        <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5" onClick={handleMarkAllRead}>
          <CheckCheck size={16} />
          <span>Mark All as Read</span>
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible">{error}</div>}
      {successMsg && <div className="alert alert-success alert-dismissible">{successMsg}</div>}

      {/* Filter Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => { setFilter('ALL'); setPage(1); }}
          >
            All Alerts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'UNREAD' ? 'active' : ''}`}
            onClick={() => { setFilter('UNREAD'); setPage(1); }}
          >
            Unread Only
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'READ' ? 'active' : ''}`}
            onClick={() => { setFilter('READ'); setPage(1); }}
          >
            Archived / Read
          </button>
        </li>
      </ul>

      {/* Notification List */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-2">Loading alert logs...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <Inbox size={40} className="text-muted mb-2" />
              <h5>No notifications to display</h5>
              <p className="text-muted small">You are all caught up!</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`list-group-item p-3 d-flex align-items-center justify-content-between ${
                    !item.is_read ? 'bg-primary-subtle bg-opacity-25' : ''
                  }`}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-2 rounded bg-light border mt-1">
                      {renderTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="fw-bold mb-0">{item.title}</h6>
                        <span className="badge bg-light text-dark border small">{item.type || 'SYSTEM'}</span>
                        {!item.is_read && <span className="badge bg-primary">New</span>}
                      </div>
                      <p className="text-muted small mb-1">{item.message}</p>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    {!item.is_read && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                      onClick={() => handleDelete(item.id)}
                      title="Delete alert"
                    >
                      <Trash2 size={14} />
                      <span className="d-none d-md-inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="text-muted small">
              Page {pagination.page} of {pagination.pages} ({pagination.total} alerts)
            </span>
            <div>
              <button
                className="btn btn-outline-secondary btn-sm me-2"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;