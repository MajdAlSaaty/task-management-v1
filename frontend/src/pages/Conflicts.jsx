import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTasks } from '../contexts/TaskContext';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import './Conflicts.css';

const Conflicts = () => {
  const { fetchTasks } = useTasks();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, conflict: null });

  useEffect(() => { fetchConflicts(); }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/conflicts');
      setConflicts(response.data.data || []);
    } catch (err) {
      setError('فشل في تحميل التعارضات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendDeadline = (conflict) => { setConfirmDialog({ isOpen: true, conflict }); };
  // eslint-disable-next-line no-unused-vars
  const handleDeleteConflict = async (e, id) => { e.stopPropagation(); try { await api.delete(`/conflicts/${id}`); await fetchConflicts(); } catch (err) { setError('فشل في حذف التعارض'); } };

  const handleConfirmExtend = async () => {
    const conflict = confirmDialog.conflict;
    if (!conflict) return;
    const suggestedFix = conflict.suggested_fix || '';
    const dateMatch = suggestedFix.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) { setError('لا يمكن تحديد التاريخ المقترح'); setConfirmDialog({ isOpen: false, conflict: null }); return; }
    const suggestedDate = dateMatch[1];
    const taskId = conflict.task1_id;
    try {
      setSuccessMessage('');
      setError(null);
      setConfirmDialog({ isOpen: false, conflict: null });
      await api.put(`/tasks/${taskId}`, { deadline: suggestedDate + ' 23:59:00' });
      await api.post(`/tasks/${taskId}/auto-schedule`);
      await fetchTasks();
      setSuccessMessage('تم تمديد الموعد وجدولة المهمة بنجاح!');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setSuccessMessage('تم تمديد الموعد النهائي. تعذرت الجدولة — راجع التعارض الجديد للحصول على موعد مقترح محدث.');
    }
    await fetchConflicts();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const getConflictTypeLabel = (type) => { switch (type) { case 'insufficient_time': return 'وقت غير كافٍ'; case 'overlap': return 'تداخل في المواعيد'; default: return type || 'غير معروف'; } };
  const formatDate = (dateString) => { try { const date = new Date(dateString); return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateString; } };

  if (loading) return <div className="conflicts-page"><LoadingSpinner message="جاري تحميل التعارضات..." /></div>;

  return (
    <div className="conflicts-page">
      <div className="page-header"><h1>⚠️ التعارضات</h1></div>
      {successMessage && <div className="success-message"><p>✅ {successMessage}</p></div>}
      {error && <div className="error-message"><p>⚠️ {error}</p><button onClick={fetchConflicts}>إعادة المحاولة</button></div>}
      {conflicts.length === 0 ? (<div className="empty-state"><div className="empty-icon">✅</div><p className="empty-title">لا توجد تعارضات</p><p className="empty-subtitle">جميع مهامك تسير بشكل ممتاز!</p></div>) : (
        <div className="conflicts-list">{conflicts.map((conflict) => (<div key={conflict.id} className="conflict-card"><div className="conflict-card-content"><div className="conflict-icon">⚠️</div><div className="conflict-info"><h3 className="conflict-task-title">{conflict.task1?.title || 'مهمة مجهولة'}</h3><div className="conflict-details"><span className="conflict-type">{getConflictTypeLabel(conflict.conflict_type)}</span><p className="conflict-description">{conflict.suggested_fix || 'يوجد تعارض يحتاج حلولاً'}</p>{conflict.suggested_fix && (<div className="conflict-actions"><button className="extend-btn" onClick={() => handleExtendDeadline(conflict)}>تمديد الموعد النهائي</button></div>)}</div></div></div><button className="conflict-delete-btn" onClick={(e) => handleDeleteConflict(e, conflict.id)} title="حذف التعارض">✕</button><div className="conflict-date">{formatDate(conflict.created_at)}</div></div>))}</div>)}
      <ConfirmDialog isOpen={confirmDialog.isOpen} title="تمديد الموعد النهائي" message={confirmDialog.conflict ? `هل تريد تمديد موعد ${confirmDialog.conflict.task1?.title || 'المهمة'} النهائي إلى ${(confirmDialog.conflict.suggested_fix || '').match(/(\d{4}-\d{2}-\d{2})/)?.[1] || ''}؟` : ''} onConfirm={handleConfirmExtend} onCancel={() => setConfirmDialog({ isOpen: false, conflict: null })} confirmText="تمديد" cancelText="إلغاء" />
    </div>
  );
};

export default Conflicts;