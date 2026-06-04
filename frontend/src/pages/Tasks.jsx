import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import ConfirmDialog from '../components/ConfirmDialog';

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const Tasks = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, loading } = useTasks();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: getTodayDate(),
    dueTime: '23:59',
    duration: 30,
    priority: 'متوسطة',
    reminderMinutes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmTask, setConfirmTask] = useState(null);
  const [confirmEdit, setConfirmEdit] = useState(null);

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
        reminderMinutes: '',
      });
      setError('');
    } catch {
      setError( 'حدث خطأ أثناء الإضافة   ');
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setEditForm({
      ...task,
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '23:59',
      description: task.description || '',
      reminderMinutes: task.reminderMinutes || '',
    });
  };

  const doUpdate = async (id) => {
    try {
      await updateTask(id, editForm);
      setEditingId(null);
      setEditForm(null);
      setError('');
    } catch {
      setError('حدث خطأ أثناء التحديث');
    }
  };

  const handleUpdate = (id) => {
    if (!editForm.title.trim()) return setError('العنوان مطلوب');
    setConfirmEdit(id);
  };

  const handleConfirmUpdate = async () => {
    const id = confirmEdit;
    setConfirmEdit(null);
    await doUpdate(id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setDeleteSuccess('🗑️ تم حذف المهمة بنجاح');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('❌ حدث خطأ أثناء الحذف');
    }
  };

  const doToggle = async (id, completed) => {
    setUpdatingId(id);
    try {
      await toggleComplete(id, completed);
    } catch {
      setError('حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggle = (task) => {
    if (!task.completed) {
      setConfirmTask(task);
    } else {
      doToggle(task.id, false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!confirmTask) return;
    const task = confirmTask;
    setConfirmTask(null);
    await doToggle(task.id, true);
  };

  if (loading) return <div className="card">جاري تحميل المهام...</div>;

  return (
    <div>
      {error && <div className="toast toast-error">{error}</div>}
      {deleteSuccess && <div className="toast toast-error">{deleteSuccess}</div>}

      <div className="card">
        <h3 className="card-title">➕ إضافة مهمة جديدة</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>العنوان *</label>
            <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="form-control" required />
          </div>
          <div className="form-group">
            <label>الوصف</label>
            <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="form-control" rows="2" />
          </div>
          <div className="form-group">
            <label>الموعد النهائي</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="date" value={newTask.dueDate} min={getTodayDate()} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="form-control" style={{ flex: 2 }} required />
              <input type="time" value={newTask.dueTime} min={newTask.dueDate === getTodayDate() ? getCurrentTime() : undefined} onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })} className="form-control" style={{ flex: 1 }} required />
            </div>
          </div>
          <div className="form-group">
            <label>المدة (دقائق)</label>
            <input type="number" value={newTask.duration} onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })} className="form-control" min="5" step="5" />
          </div>
          <div className="form-group">
            <label>تذكير قبل (دقائق)</label>
            <select value={newTask.reminderMinutes} onChange={(e) => setNewTask({ ...newTask, reminderMinutes: e.target.value })} className="form-control">
              <option value="">لا يوجد</option>
              <option value="5">5 دقائق</option>
              <option value="10">10 دقائق</option>
              <option value="15">15 دقيقة</option>
              <option value="30">30 دقيقة</option>
              <option value="60">ساعة</option>
              <option value="120">ساعتان</option>
              <option value="1440">يوم</option>
              <option value="2880">يومان</option>
              <option value="4320">3 أيام</option>
              <option value="10080">أسبوع</option>
            </select>
          </div>
          <div className="form-group">
            <label>الأولوية</label>
            <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="form-control">
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
        {tasks.length === 0 ? <p>لا توجد مهام. أضف مهمة جديدة!</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map(task => (
              <li key={task.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                {editingId === task.id ? (
                  <div>
                    <div className="form-group"><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="form-control" /></div>
                    <div className="form-group"><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="form-control" rows="2" /></div>
                    <div className="form-group">
                      <label>الموعد النهائي</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="date" value={editForm.dueDate || ''} min={getTodayDate()} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="form-control" style={{ flex: 2 }} />
                        <input type="time" value={editForm.dueTime || '23:59'} min={editForm.dueDate === getTodayDate() ? getCurrentTime() : undefined} onChange={(e) => setEditForm({ ...editForm, dueTime: e.target.value })} className="form-control" style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>الأولوية</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="form-control">
                        <option value="عالية">عالية</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="منخفضة">منخفضة</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>المدة (دقائق)</label>
                      <input type="number" value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })} className="form-control" min="5" step="5" />
                    </div>
                    <div className="form-group">
                      <label>تذكير قبل (دقائق)</label>
                      <select value={editForm.reminderMinutes} onChange={(e) => setEditForm({ ...editForm, reminderMinutes: e.target.value })} className="form-control">
                        <option value="">لا يوجد</option>
                        <option value="5">5 دقائق</option>
                        <option value="10">10 دقائق</option>
                        <option value="15">15 دقيقة</option>
                        <option value="30">30 دقيقة</option>
                        <option value="60">ساعة</option>
                        <option value="120">ساعتان</option>
                        <option value="1440">يوم</option>
                        <option value="2880">يومان</option>
                        <option value="4320">3 أيام</option>
                        <option value="10080">أسبوع</option>
                      </select>
                    </div>
                    <div>
                      <button onClick={() => handleUpdate(task.id)} className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>حفظ</button>
                      <button onClick={() => setEditingId(null)} className="btn btn-secondary">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={task.completed} disabled={updatingId === task.id} onChange={() => handleToggle(task)} style={{ width: '1.25rem', height: '1.25rem' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{task.description}</div>}
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {task.dueDate && <span>📅 {task.dueDate} {task.dueTime && task.dueTime !== '23:59' ? `⏰ ${task.dueTime}` : ''} | </span>}
                          <span>⏱️ {task.duration} دقيقة | </span>
                          <span>⭐ {task.priorityLabel}</span>
                          {task.reminderMinutes && <span> 🔔</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => handleEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>✏️</button>
                      <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>🗑️</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog isOpen={!!confirmEdit} title="تأكيد حفظ التغييرات" message="هل أنت متأكد من حفظ التغييرات؟ قد يؤدي تعديل المدة أو الموعد النهائي إلى إعادة جدولة المهمة." confirmText="نعم، حفظ" cancelText="إلغاء" onConfirm={handleConfirmUpdate} onCancel={() => setConfirmEdit(null)} />
      <ConfirmDialog isOpen={!!confirmTask} title="تأكيد إتمام المهمة" message={`هل أنت متأكد من إتمام مهمة "${confirmTask?.title}"؟`} confirmText="نعم، تم الإنجاز" cancelText="إلغاء" onConfirm={handleConfirmComplete} onCancel={() => setConfirmTask(null)} />
    </div>
  );
};

export default Tasks;