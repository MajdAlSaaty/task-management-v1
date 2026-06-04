import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const getLocalDateValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const parseDateOnly = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDay = currentDateTime.toLocaleDateString('ar-EG', { weekday: 'long' });
  const formattedTime = currentDateTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const pieData = [
    { name: 'مكتملة', value: completed, color: 'var(--secondary)' },
    { name: 'متبقية', value: pending, color: 'var(--warning)' },
  ];

  const getWeekdayTasksCount = () => {
    const weekdays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const counts = weekdays.map(day => ({ day, count: 0 }));
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = parseDateOnly(task.dueDate);
        if (!date) return;
        const weekdayIndex = date.getDay();
        if (weekdayIndex >= 0 && weekdayIndex < 7) {
          counts[weekdayIndex].count += 1;
        }
      }
    });
    return counts;
  };

  const barData = getWeekdayTasksCount();
  const today = getLocalDateValue();
  const todayTasks = tasks.filter(t => t.dueDate?.slice(0,10) === today && !t.completed);
  const displayName = user?.name || user?.email?.split('@')[0] || 'مستخدم';

  const getPriorityColor = (priority) => {
    const colors = { 'عالية': 'var(--danger)', 'متوسطة': 'var(--warning)', 'منخفضة': 'var(--secondary)' };
    return colors[priority] || 'var(--gray-600)';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', flex: 1, marginBottom: 0 }}>
          <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>👋 مرحباً, {displayName}!</h3>
          <p style={{ opacity: 0.9, margin: 0 }}>هذه هي لوحة التحكم الخاصة بك. تابع تقدم مهامك وحلل إنتاجيتك.</p>
        </div>
        <div className="card" style={{ background: 'var(--gray-50)', borderRight: '4px solid var(--primary)', textAlign: 'center', minWidth: '200px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{formattedDay}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formattedDate}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>{formattedTime}</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">نسبة الإنجاز</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => `${value} مهمة`}
                contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="stat-value" style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>{completionRate}%</div>
          <div className="stat-label">إنجاز</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">📊 توزيع المهام حسب أيام الأسبوع</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="day" tick={{ fill: 'var(--text)' }} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--text)' }} />
            <Tooltip formatter={(value) => `${value} مهمة`}
              contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="card-title">📋 مهام اليوم</h3>
        {loading ? <LoadingSpinner message="جاري تحميل المهام..." /> : todayTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>🎉</span>
            <p>لا توجد مهام محددة لهذا اليوم. استمتع بيومك!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {todayTasks.map(task => (
              <div key={task.id} className="task-card" style={{ background: 'var(--gray-50)', borderRadius: '0.75rem', padding: '1rem', borderRight: `4px solid ${getPriorityColor(task.priorityLabel)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{task.title}</strong>
                    {task.description && <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{task.description}</div>}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                      <span>⏱️ {task.duration} دقيقة</span>
                      <span style={{ color: getPriorityColor(task.priorityLabel) }}>⭐ {task.priorityLabel}</span>
                    </div>
                  </div>
                  <div style={{ 
                      background: getPriorityColor(task.priorityLabel), 
                      color: 'white', 
                      borderRadius: '9999px', 
                      padding: '0.4rem 0.9rem', 
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: 'var(--shadow-sm)',
                      minWidth: '70px'
                    }}>
                      {task.priorityLabel}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;