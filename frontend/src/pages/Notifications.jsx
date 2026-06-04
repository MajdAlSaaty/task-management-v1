import { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../components/NotificationBell.css';

const Notifications = () => {
  const { notifications, loading, error, fetchNotifications, markRead, markAllRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => { setLocalNotifications(notifications); }, [notifications]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id) => { try { await markRead(id); } catch (err) { console.error(err); } };
  const handleMarkAllRead = async () => { try { await markAllRead(); } catch (err) { console.error(err); } };
  const handleDelete = async (e, id) => { e.stopPropagation(); try { await deleteNotification(id); } catch (err) { console.error(err); } };
  const handleDeleteAll = async () => { try { await deleteAllNotifications(); } catch (err) { console.error(err); } };

  const formatFullDate = (dateString) => { try { const date = new Date(dateString); return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return dateString; } };
  const getTypeColor = (type) => { switch (type) { case 'conflict': return 'var(--danger)'; case 'reminder': return 'var(--warning)'; default: return 'var(--primary)'; } };
  const getTypeIcon = (type) => { switch (type) { case 'conflict': return '⚠️'; case 'reminder': return '⏰'; default: return 'ℹ️'; } };
  const getTypeLabel = (type) => { switch (type) { case 'conflict': return 'تعارض'; case 'reminder': return 'تذكير'; default: return 'نظام'; } };

  if (loading && localNotifications.length === 0) return <div className="notifications-page"><LoadingSpinner message="جاري تحميل الإشعارات..." /></div>;

  return (
    <div className="notifications-page">
      <div className="page-header"><h1>الإشعارات</h1><div className="page-header-actions">{localNotifications.some(n => !n.is_read) && <button className="mark-all-read-btn" onClick={handleMarkAllRead}>تحديد الكل كمقروء</button>}{localNotifications.length > 0 && <button className="delete-all-btn" onClick={handleDeleteAll}>حذف الكل</button>}</div></div>
      {error && <div className="error-message"><p>⚠️ {error}</p><button onClick={() => fetchNotifications()}>إعادة المحاولة</button></div>}
      {localNotifications.length === 0 ? (<div className="empty-state"><div className="empty-icon">🔔</div><p className="empty-title">لا توجد إشعارات بعد</p><p className="empty-subtitle">ستظهر هنا جميع الإشعارات المتعلقة بمهامك</p></div>) : (
        <div className="notifications-list">{localNotifications.map((notification) => (<div key={notification.id} className={`notification-card ${!notification.is_read ? 'unread' : ''}`} onClick={() => handleMarkRead(notification.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleMarkRead(notification.id)}><div className="notification-card-content"><div className="notification-icon" style={{ color: getTypeColor(notification.type) }}>{getTypeIcon(notification.type)}</div><div className="notification-info"><div className="notification-meta"><span className="notification-type-badge" style={{ backgroundColor: getTypeColor(notification.type) }}>{getTypeLabel(notification.type)}</span><span className="notification-date">{formatFullDate(notification.scheduled_time)}</span></div><h3 className={`notification-title ${!notification.is_read ? 'bold' : ''}`}>{notification.title || notification.message.split('.')[0]}</h3><p className={`notification-body ${!notification.is_read ? 'bold' : ''}`}>{notification.message}</p></div>{!notification.is_read && <div className="unread-dot" />}<button className="delete-notification-btn" onClick={(e) => handleDelete(e, notification.id)} title="حذف الإشعار">✕</button></div></div>))}</div>)}
    </div>
  );
};

export default Notifications;