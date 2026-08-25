import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../notificationsApi';
import { 
  Bell, 
  Megaphone, 
  CalendarDays, 
  CreditCard, 
  Image as ImageIcon, 
  Info, 
  CheckCheck, 
  ArrowRight 
} from 'lucide-react';

const renderTypeIcon = (type) => {
  switch (type) {
    case 'CAMPAIGN':
      return <Megaphone size={18} className="text-primary" />;
    case 'BOOKING':
      return <CalendarDays size={18} className="text-success" />;
    case 'INVOICE':
      return <CreditCard size={18} className="text-warning" />;
    case 'CREATIVE':
      return <ImageIcon size={18} className="text-info" />;
    default:
      return <Info size={18} className="text-secondary" />;
  }
};

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      // Quiet fail if session expired
    }
  };

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications({ per_page: 5 });
      setRecentNotifications(data.notifications || data.items || []);
    } catch (e) {
      console.error('Failed to load recent notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    // Poll unread count every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchRecent();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-sm btn-outline-secondary rounded-circle position-relative p-2 d-flex align-items-center justify-content-center"
        style={{ width: '36px', height: '36px' }}
        onClick={toggleDropdown}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 shadow-lg border rounded-3 p-0"
          style={{
            width: '340px',
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            zIndex: 1050,
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Bell size={16} className="text-primary" />
              Notifications
            </h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-link btn-sm p-0 text-decoration-none small d-flex align-items-center gap-1"
                onClick={handleMarkAllRead}
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4 text-muted small">Loading alerts...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">No notifications</div>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border-bottom transition-all ${
                    !item.is_read ? 'bg-primary-subtle bg-opacity-25' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start gap-2.5">
                    <div className="p-1 rounded bg-light border mt-0.5">
                      {renderTypeIcon(item.type)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-semibold small" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-muted small mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                        {item.message}
                      </p>
                      {!item.is_read && (
                        <button
                          className="btn btn-link btn-sm p-0 small text-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-top text-center bg-light rounded-bottom">
            <Link
              to="/notifications"
              className="text-decoration-none small fw-semibold text-primary d-inline-flex align-items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              <span>View All Notifications</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;