import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_ARABIC = {
  Monday: 'الإثنين',
  Tuesday: 'الثلاثاء',
  Wednesday: 'الأربعاء',
  Thursday: 'الخميس',
  Friday: 'الجمعة',
  Saturday: 'السبت',
  Sunday: 'الأحد',
};

const Preferences = () => {
  const { preferences, updateDayPreference, deleteDayPreference, refreshPreferences } = useAuth();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [formData, setFormData] = useState({
    preferred_start_time: '09:00',
    preferred_end_time: '17:00',
    break_start_time: '',
    break_end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    refreshPreferences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPreferences = preferences.some(p => p.day_of_week === selectedDay);

  useEffect(() => {
    if (!preferences) return;
    const dayPref = preferences.find(p => p.day_of_week === selectedDay);
    if (dayPref) {
      setFormData({
        preferred_start_time: dayPref.preferred_start_time?.slice(0, 5) || '09:00',
        preferred_end_time: dayPref.preferred_end_time?.slice(0, 5) || '17:00',
        break_start_time: dayPref.break_start_time?.slice(0, 5) || '',
        break_end_time: dayPref.break_end_time?.slice(0, 5) || '',
      });
    } else {
      setFormData({
        preferred_start_time: '09:00',
        preferred_end_time: '17:00',
        break_start_time: '',
        break_end_time: '',
      });
    }
  }, [selectedDay, preferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await updateDayPreference(selectedDay, {
        preferred_start_time: formData.preferred_start_time,
        preferred_end_time: formData.preferred_end_time,
        break_start_time: formData.break_start_time || null,
        break_end_time: formData.break_end_time || null,
      });
      setSuccess(`✅ تم حفظ تفضيلات يوم ${DAYS_ARABIC[selectedDay]}`);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'فشل الحفظ'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteSuccess('');
    setDeleteError('');
    try {
      await deleteDayPreference(selectedDay);
      setDeleteSuccess(`🗑️ تم حذف تفضيلات يوم ${DAYS_ARABIC[selectedDay]}`);
      setFormData({
        preferred_start_time: '09:00',
        preferred_end_time: '17:00',
        break_start_time: '',
        break_end_time: '',
      });
    } catch (err) {
      setDeleteError(`❌ ${err.response?.data?.message || 'فشل الحذف'}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">⏰ تفضيلات أوقات الدراسة</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {DAYS_OF_WEEK.map(day => {
          const hasPref = preferences.some(p => p.day_of_week === day);
          return (
            <button key={day} onClick={() => setSelectedDay(day)} style={{ padding: '0.5rem 1rem', borderRadius: '2rem', border: hasPref ? '2px solid var(--primary)' : 'none', background: selectedDay === day ? 'var(--primary)' : 'var(--gray-200)', color: selectedDay === day ? 'white' : 'var(--gray-800)', cursor: 'pointer' }}>
              {DAYS_ARABIC[day]}
            </button>
          );
        })}
      </div>
      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}
      {deleteSuccess && <div className="toast toast-error">{deleteSuccess}</div>}
      {deleteError && <div className="toast toast-error">{deleteError}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>وقت بدء الدراسة</label><input type="time" value={formData.preferred_start_time} onChange={(e) => setFormData({ ...formData, preferred_start_time: e.target.value })} className="form-control" required /></div>
        <div className="form-group"><label>وقت انتهاء الدراسة</label><input type="time" value={formData.preferred_end_time} onChange={(e) => setFormData({ ...formData, preferred_end_time: e.target.value })} className="form-control" required /></div>
        <div className="form-group"><label>بداية الاستراحة (اختياري)</label><input type="time" value={formData.break_start_time} onChange={(e) => setFormData({ ...formData, break_start_time: e.target.value })} className="form-control" /></div>
        <div className="form-group"><label>نهاية الاستراحة (اختياري)</label><input type="time" value={formData.break_end_time} onChange={(e) => setFormData({ ...formData, break_end_time: e.target.value })} className="form-control" /></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'جاري الحفظ...' : `حفظ تفضيلات ${DAYS_ARABIC[selectedDay]}`}</button>
          {hasPreferences && (<button type="button" onClick={handleDelete} disabled={deleting} style={{ background: 'var(--danger)', color: 'white' }} className="btn">{deleting ? 'جاري الحذف...' : 'حذف التفضيلات'}</button>)}
        </div>
      </form>
    </div>
  );
};

export default Preferences;