import { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import api from '../services/api';

const getLocalDateValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const Scheduler = () => {
  const { tasks, loading, autoScheduleTask } = useTasks();
  const [slots, setSlots] = useState([]);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue());

  const fetchSlots = async () => {
    try {
      const response = await api.get(`/slots?date=${selectedDate}`);
      setSlots(response.data.data || response.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    let active = true;

    api.get(`/slots?date=${selectedDate}`)
      .then((response) => {
        if (active) {
          setSlots(response.data.data || response.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed');

  const handleAutoScheduleAll = async () => {
    setScheduling(true);
    for (const task of pendingTasks) {
      try { await autoScheduleTask(task.id); } catch (err) { console.error(err); }
    }
    setScheduling(false);
    fetchSlots();
    alert('تمت محاولة جدولة جميع المهام المعلقة');
  };

  if (loading) return <div className="card">جاري التحميل...</div>;

  return (
    <div>
      <div className="card">
        <h3 className="card-title">⏰ جدولة ذكية</h3>
        <p>عدد المهام المعلقة: {pendingTasks.length}</p>
        <button onClick={handleAutoScheduleAll} disabled={scheduling || pendingTasks.length === 0} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          {scheduling ? 'جاري الجدولة...' : 'جدولة جميع المهام المعلقة'}
        </button>
      </div>
      <div className="card">
        <h3 className="card-title">📅 الجدول اليومي</h3>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: '1rem' }} />
        {slots.length === 0 ? <p>لا توجد مهام مجدولة لهذا اليوم.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {slots.map(slot => (
              <li key={slot.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{slot.task?.title || 'مهمة'}</strong><br /><small>{new Date(slot.start_time).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})} - {new Date(slot.end_time).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</small></span>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', background: slot.status === 'completed' ? 'var(--secondary)' : 'var(--primary)', color: 'white', fontSize: '0.75rem' }}>{slot.status === 'completed' ? 'مكتمل' : 'مجدول'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Scheduler;