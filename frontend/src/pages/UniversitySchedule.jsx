import { useState, useEffect } from 'react';
import api from '../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_ARABIC = { Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت', Sunday: 'الأحد' };

const toDateValue = (value) => (typeof value === 'string' ? value.slice(0, 10) : '');
const toTimeValue = (value) => (typeof value === 'string' ? value.slice(0, 5) : '');

const getApiErrorMessage = (error) => {
  const validationErrors = error?.response?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors).flat()[0];
    if (first) return first;
  }
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'حدث خطأ غير متوقع';
};

const UniversitySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // ✅ SUCCESS STATE
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', valid_from: '', valid_until: '' });

  useEffect(() => {
    let active = true;
    api.get('/university-schedule')
      .then((response) => {
        if (active) {
          setSchedules(Array.isArray(response.data) ? response.data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(`تعذر تحميل الجدول: ${getApiErrorMessage(err)}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(''); // ✅ Clear previous success

    const payload = { ...formData };
    if (!payload.valid_until) delete payload.valid_until;

    try {
      if (editingId) {
        const response = await api.put(`/university-schedule/${editingId}`, payload);
        setSchedules((prev) => prev.map((item) => (item.id === editingId ? response.data : item)));
        setSuccess('تم تحديث المحاضرة بنجاح'); // ✅ Success on update
      } else {
        const response = await api.post('/university-schedule', payload);
        setSchedules((prev) => [...prev, response.data]);
        setSuccess('تمت إضافة المحاضرة بنجاح'); // ✅ Success on create
      }
      resetForm();
    } catch (err) {
      setError(`فشل الحفظ: ${getApiErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد؟')) {
      setError('');
      setSuccess(''); // ✅ Clear previous success
      try {
        await api.delete(`/university-schedule/${id}`);
        setSchedules((prev) => prev.filter((item) => item.id !== id));
        setSuccess('تم حذف المحاضرة بنجاح'); // ✅ Success on delete
      } catch (err) {
        setError(`فشل الحذف: ${getApiErrorMessage(err)}`);
      }
    }
  };

  const handleEdit = (s) => {
    setError('');
    setSuccess(''); // ✅ Clear messages when starting edit
    setEditingId(s.id);
    setFormData({
      title: s.title,
      day_of_week: s.day_of_week,
      start_time: toTimeValue(s.start_time),
      end_time: toTimeValue(s.end_time),
      valid_from: toDateValue(s.valid_from),
      valid_until: toDateValue(s.valid_until),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', valid_from: '', valid_until: '' });
    setEditingId(null);
    setShowForm(false);
    // Note: We don't clear success/error here to allow messages to persist after form close
  };

  if (loading) return <div className="card">جاري التحميل...</div>;

  return (
    <div>
      {/* ✅ Error message display */}
      {error && <div className="card" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}
      
      {/* ✅ Success message display */}
      {success && <div className="card" style={{ background: '#dcfce7', color: '#166534' }}>{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3 className="card-title">🏛️ الجدول الجامعي</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'إلغاء' : 'إضافة محاضرة'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem' }}>
            <div className="form-group"><label>اسم المحاضرة</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="form-control" required /></div>
            <div className="form-group"><label>اليوم</label><select value={formData.day_of_week} onChange={(e) => setFormData({...formData, day_of_week: e.target.value})} className="form-control">{DAYS_OF_WEEK.map(day => <option key={day} value={day}>{DAYS_ARABIC[day]}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label>وقت البداية</label><input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="form-control" required /></div>
              <div className="form-group"><label>وقت النهاية</label><input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="form-control" required /></div>
            </div>
            <div className="form-group"><label>تاريخ البدء</label><input type="date" value={formData.valid_from} onChange={(e) => setFormData({...formData, valid_from: e.target.value})} className="form-control" required /></div>
            <div className="form-group"><label>تاريخ الانتهاء (اختياري)</label><input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className="form-control" /></div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : (editingId ? 'تحديث' : 'إضافة')}</button>
            <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ marginRight: '0.5rem' }} disabled={saving}>إلغاء</button>
          </form>
        )}
      </div>
      <div className="card">
        <h3 className="card-title">📋 المحاضرات المسجلة</h3>
        {schedules.length === 0 ? <p>لا توجد محاضرات مسجلة.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {schedules.map(s => (
              <li key={s.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between' }}>
                <div><strong>{s.title}</strong><div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{DAYS_ARABIC[s.day_of_week]} | {toTimeValue(s.start_time)} - {toTimeValue(s.end_time)}<br />{toDateValue(s.valid_from)} {s.valid_until && `إلى ${toDateValue(s.valid_until)}`}</div></div>
                <div><button onClick={() => handleEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}>✏️</button><button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>🗑️</button></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UniversitySchedule;