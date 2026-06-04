import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../contexts/TaskContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Timeline from '../components/Timeline/Timeline';
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
  const [view, setView] = useState('day');

  const fetchSlots = useCallback(async () => {
    try {
      const response = await api.get('/slots');
      setSlots(response.data.data || response.data);
    } catch (err) { console.error(err); }
  }, []);

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
      if (result && result.error) {
        setErrorMessage(result.error);
        return;
      }
      if (!result || !Array.isArray(result.results)) {
        setErrorMessage('استجابة غير متوقعة من الخادم');
        return;
      }
      const succeeded = result.results.filter(r => r.success);
      const failed    = result.results.filter(r => !r.success);
      if (failed.length === 0 && succeeded.length === 0) {
        setSuccessMessage('لا توجد مهام معلقة للجدولة');
      } else if (failed.length === 0) {
        setSuccessMessage(`✅ تمت جدولة ${succeeded.length} مهمة بنجاح`);
      } else {
        if (succeeded.length > 0) setSuccessMessage(`✅ تمت جدولة ${succeeded.length} مهمة بنجاح`);
        const failedDetails = failed.map(f => `${f.title} (${f.reason || 'غير معروف'})`).join('، ');
        setErrorMessage(`❌ ${failed.length} مهمة فشلت: ${failedDetails}`);
      }
    } catch (err) {
      setErrorMessage('خطأ غير متوقع: ' + (err.response?.data?.error || err.message || 'خطأ غير معروف'));
    } finally {
      setScheduling(false);
      fetchSlots();
    }
  };

  if (loading) return <LoadingSpinner message="جاري التحميل..." />;

  return (
    <div>
      <div className="card">
        <h3 className="card-title">⏰ جدولة ذكية</h3>
        <p>عدد المهام المعلقة: {pendingTasks.length}</p>
        <button onClick={handleAutoScheduleAll} disabled={scheduling || pendingTasks.length === 0} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          {scheduling ? 'جاري الجدولة...' : 'جدولة المهام المعلقة'}
        </button>
        {successMessage && <div className="toast toast-success">{successMessage}</div>}
        {errorMessage && <div className="toast toast-error">{errorMessage}</div>}
      </div>

      <div className="card">
        <h3 className="card-title">📅 الجدول اليومي</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', justifyContent: 'space-between' }}>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="form-control" style={{ width: 'auto' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('day')}>يوم</button>
            <button className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('week')}>أسبوع</button>
          </div>
        </div>
        <Timeline slots={slots} view={view} selectedDate={selectedDate} />
      </div>
    </div>
  );
};

export default Scheduler;