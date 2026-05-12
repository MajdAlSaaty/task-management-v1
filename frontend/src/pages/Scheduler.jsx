import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../contexts/TaskContext';
import api from '../services/api';

const getLocalDateValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const Scheduler = () => {
  const { tasks, loading, autoScheduleAllTasks } = useTasks();
  const [slots, setSlots] = useState([]);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

<<<<<<< HEAD:src/pages/Scheduler.jsx
  const fetchSlots = useCallback(async () => {
=======

  const fetchSlots = async () => {
>>>>>>> ee8d377ab5ba4ef87fab4f5804feffe33c3b7c49:frontend/src/pages/Scheduler.jsx
    try {
      const response = await api.get(`/slots?date=${selectedDate}`);
      setSlots(response.data.data || response.data);
    } catch (err) { console.error(err); }
<<<<<<< HEAD:src/pages/Scheduler.jsx
=======
  };

  useEffect(() => {
    let active = true;
    api.get(`/slots?date=${selectedDate}`)
      .then((response) => { if (active) setSlots(response.data.data || response.data); })
      .catch(console.error);
    return () => { active = false; };
>>>>>>> ee8d377ab5ba4ef87fab4f5804feffe33c3b7c49:frontend/src/pages/Scheduler.jsx
  }, [selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const handleAutoScheduleAll = async () => {
    setScheduling(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await autoScheduleAllTasks();

      // Handle error from TaskContext (network/server error)
      if (result && result.error) {
        setErrorMessage(result.error);
        return;
      }

      // Handle case where API returns unexpected format or no results
      if (!result || !Array.isArray(result.results)) {
        setErrorMessage('استجابة غير متوقعة من الخادم');
        return;
      }

      // Separate successful and failed tasks
      const succeeded = result.results.filter(r => r.success);
      const failed    = result.results.filter(r => !r.success);

      if (failed.length === 0 && succeeded.length === 0) {
        setSuccessMessage('لا توجد مهام معلقة للجدولة');
      } else if (failed.length === 0) {
        setSuccessMessage(`✅ تمت جدولة ${succeeded.length} مهمة بنجاح`);
      } else {
        // Always show success first (only if there are successes)
        if (succeeded.length > 0) {
          setSuccessMessage(`✅ تمت جدولة ${succeeded.length} مهمة بنجاح`);
        }

        // Then show failed tasks
        const failedDetails = failed.map(f => {
          const reason = f.reason || 'غير معروف';
          return `${f.title} (${reason})`;
        }).join('، ');
        setErrorMessage(`❌ ${failed.length} مهمة فشلت: ${failedDetails}`);
      }
    } catch (err) {
      setErrorMessage('خطأ غير متوقع: ' + (err.response?.data?.error || err.message || 'خطأ غير معروف'));
    } finally {
      setScheduling(false);
      fetchSlots();
    }
<<<<<<< HEAD:src/pages/Scheduler.jsx
=======
    setScheduling(false);
    fetchSlots(); 
    alert('تمت محاولة جدولة جميع المهام المعلقة');
>>>>>>> ee8d377ab5ba4ef87fab4f5804feffe33c3b7c49:frontend/src/pages/Scheduler.jsx
  };

  if (loading) return <div className="card">جاري التحميل...</div>;

  return (
    <div>
      <div className="card">
        <h3 className="card-title">⏰ جدولة ذكية</h3>
        <p>عدد المهام المعلقة: {pendingTasks.length}</p>
        <button
          onClick={handleAutoScheduleAll}
          disabled={scheduling || pendingTasks.length === 0}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          {scheduling ? 'جاري الجدولة...' : 'جدولة المهام المعلقة'}
        </button>
        {successMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#dcfce7',
            color: '#166534',
          }}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#fee2e2',
            color: '#b91c1c',
          }}>
            {errorMessage}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">📅 الجدول اليومي</h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="form-control"
          style={{ width: 'auto', marginBottom: '1rem' }}
        />
        {slots.length === 0 ? (
          <p>لا توجد مهام مجدولة لهذا اليوم.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {slots.map(slot => (
              <li
                key={slot.id}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <strong>{slot.task?.title || 'مهمة'}</strong>
                  <br />
                  <small>
                    {new Date(slot.start_time).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(slot.end_time).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </span>
                <span
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
                    background: slot.status === 'completed' ? '#10b981' : 'var(--primary)',
                    color: 'white',
                    minWidth: '60px'
                  }}
                >
                  {slot.status === 'completed' ? 'مكتمل' : 'مجدول'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Scheduler;