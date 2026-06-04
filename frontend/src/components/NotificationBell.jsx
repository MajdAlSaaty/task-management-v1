import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, loading, error } = useNotifications();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (id) => {
    try {
      await markRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatRelativeTime = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInSeconds = Math.floor((now - date) / 1000);
      const isFuture = diffInSeconds < 0;
      const absSeconds = Math.abs(diffInSeconds);

      if (absSeconds < 60) {
        return 'الآن';
      }
      const absMinutes = Math.floor(absSeconds / 60);
      if (absMinutes < 60) {
        return isFuture ? `بعد ${absMinutes} دقيقة` : `منذ ${absMinutes} دقيقة`;
      }
      const absHours = Math.floor(absMinutes / 60);
      if (absHours < 24) {
        return isFuture ? `بعد ${absHours} ساعة` : `منذ ${absHours} ساعة`;
      }
      const absDays = Math.floor(absHours / 24);
      if (absDays < 7) {
        return isFuture ? `بعد ${absDays} يوم` : `منذ ${absDays} يوم`;
      }
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'conflict':
        return 'var(--danger)';
      case 'reminder':
        return 'var(--warning)';
      case 'system':
      default:
        return 'var(--primary)';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'conflict':
        return 'تعارض';
      case 'reminder':
        return 'تذكير';
      case 'system':
      default:
        return 'نظام';
    }
  };

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="notification-bell-wrapper">
      <div className="notification-bell-container" ref={buttonRef}>
        <button
          className="notification-bell-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="الإشعارات"
        >
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">
              {displayCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown" ref={dropdownRef} onClick={handleDropdownClick}>
            <div className="dropdown-header">
              <h3 className="dropdown-title">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-button"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            {loading && notifications.length === 0 && (
              <div className="dropdown-empty">
                <div className="loading-spinner-container">
                  <div className="loading-spinner-small"></div>
                  <p>جاري التحميل...</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="dropdown-error">
                <p className="error-text">⚠️ تعذر تحميل الإشعارات</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 ? (
              <div className="dropdown-list">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-header">
                        <span
                          className="notification-dot"
                          style={{ backgroundColor: getTypeColor(notification.type) }}
                        />
                        <span className="notification-type-label">
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <p className="notification-time">
                        {formatRelativeTime(notification.scheduled_time)}
                      </p>
                    </div>
                    <button
                      className="bell-delete-btn"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="حذف الإشعار"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !loading && !error && (
                <div className="dropdown-empty">
                  <p className="empty-text">لا توجد إشعارات</p>
                </div>
              )
            )}

            <div className="dropdown-footer">
              <Link to="/notifications" className="view-all-link">
                عرض كل الإشعارات
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationBell;