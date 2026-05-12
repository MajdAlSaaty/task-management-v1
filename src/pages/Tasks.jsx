import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';

// Helper: Get today's date in YYYY-MM-DD format (local timezone)
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get current time in HH:MM format (local timezone)
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const Tasks = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, autoScheduleTask, loading } = useTasks();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: getTodayDate(),
    dueTime: '23:59',
    duration: 30,
    priority: 'متوسطة',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [scheduleMessage, setScheduleMessage] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return setError('عنوان المهمة مطلوب');
    try {
      await addTask(newTask);
      setNewTask({
        title: '',
        description: '',
        dueDate: getTodayDate(),
        dueTime: '23:59',
        duration: 30,
        priority: 'متوسطة',
      });
      setError('');
    } catch {
      setError('حدث خطأ أثناء الإضافة');
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setEditForm({
      ...task,
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '23:59',
      description: task.description || '',
    });
  };

  const handleUpdate = async (id) => {
    if (!editForm.title.trim()) return setError('العنوان مطلوب');
    try {
      await updateTask(id, editForm);
      setEditingId(null);
      setEditForm(null);
      setError('');
    } catch {
      setError('حدث خطأ أثناء التحديث');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setDeleteSuccess('🗑️ تم حذف المهمة بنجاح');
    } catch (err) {
      setError('❌ حدث خطأ أثناء الحذف');
    }
  };

  const handleToggle = async (task) => {
    try {
      await toggleComplete(task.id, !task.completed);
    } catch {
      setError('حدث خطأ أثناء التحديث');
    }
  };

  const handleAutoSchedule = async (taskId) => {
    setScheduleMessage('');
    try {
      await autoScheduleTask(taskId);
      setScheduleMessage('✅ تمت جدولة المهمة بنجاح');
    } catch (err) {
      setScheduleMessage('❌ فشل الجدولة: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="card">جاري تحميل المهام...</div>;

  return (
    <div>
      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          background: '#fee2e2',
          color: '#b91c1c'
        }}>
          {error}
        </div>
      )}
      {deleteSuccess && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          background: '#fee2e2',
          color: '#b91c1c'
        }}>
          {deleteSuccess}
        </div>
      )}
      {scheduleMessage && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          background: scheduleMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          color: scheduleMessage.startsWith('✅') ? '#166534' : '#b91c1c'
        }}>
          {scheduleMessage}
        </div>
      )}

      <div className="card">
        <h3 className="card-title">➕ إضافة مهمة جديدة</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>العنوان *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label>الوصف</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="form-control"
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>الموعد النهائي</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="date"
                value={newTask.dueDate}
                min={getTodayDate()}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="form-control"
                style={{ flex: 2 }}
                required
              />
              <input
                type="time"
                value={newTask.dueTime}
                min={newTask.dueDate === getTodayDate() ? getCurrentTime() : undefined}
                onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                className="form-control"
                style={{ flex: 1 }}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>المدة (دقائق)</label>
            <input
              type="number"
              value={newTask.duration}
              onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })}
              className="form-control"
              min="5"
              step="5"
            />
          </div>
          <div className="form-group">
            <label>الأولوية</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="form-control"
            >
              <option value="عالية">عالية</option>
              <option value="متوسطة">متوسطة</option>
              <option value="منخفضة">منخفضة</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">إضافة</button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">📝 قائمة المهام</h3>
        {tasks.length === 0 ? (
          <p>لا توجد مهام. أضف مهمة جديدة!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map(task => (
              <li key={task.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                {editingId === task.id ? (
                  <div>
                    <div className="form-group">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="form-control"
                        rows="2"
                      />
                    </div>
                    <div className="form-group">
                      <label>الموعد النهائي</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="date"
                          value={editForm.dueDate || ''}
                          min={getTodayDate()}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className="form-control"
                          style={{ flex: 2 }}
                        />
                        <input
                          type="time"
                          value={editForm.dueTime || '23:59'}
                          min={editForm.dueDate === getTodayDate() ? getCurrentTime() : undefined}
                          onChange={(e) => setEditForm({ ...editForm, dueTime: e.target.value })}
                          className="form-control"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>الأولوية</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                        className="form-control"
                      >
                        <option value="عالية">عالية</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="منخفضة">منخفضة</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>المدة (دقائق)</label>
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                        className="form-control"
                        min="5"
                        step="5"
                      />
                    </div>
                    <div>
                      <button onClick={() => handleUpdate(task.id)} className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>حفظ</button>
                      <button onClick={() => setEditingId(null)} className="btn btn-secondary">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggle(task)}
                        style={{ width: '1.25rem', height: '1.25rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{task.description}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {task.dueDate && (
                            <span>
                              📅 {task.dueDate} {task.dueTime && task.dueTime !== '23:59' ? `⏰ ${task.dueTime}` : ''} | 
                            </span>
                          )}
                          <span>⏱️ {task.duration} دقيقة | </span>
                          <span>⭐ {task.priorityLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleAutoSchedule(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                        title="جدولة تلقائية"
                      >
                        ⏰
                      </button>
                      <button
                        onClick={() => handleEdit(task)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Tasks;