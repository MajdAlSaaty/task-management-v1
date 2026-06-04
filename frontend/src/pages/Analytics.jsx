import { useTasks } from "../contexts/TaskContext";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card" style={{ padding: "0.5rem 1rem", background: "var(--bg)", border: "1px solid var(--border)" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].color }}>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { tasks } = useTasks();

  const getLast7DaysProgress = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString("ar-EG", { weekday: "short" });
      const completedCount = tasks.filter(t => t.completed && t.dueDate === dateStr).length;
      days.push({ day: dayName, completed: completedCount, date: dateStr });
    }
    return days;
  };

  const progressData = getLast7DaysProgress();

  const getRemainingTasksThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekDays = [];
    for (let i = 0; i <= 6; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString("ar-EG", { weekday: "short" });
      const remaining = tasks.filter(t => !t.completed && t.dueDate === dateStr).length;
      weekDays.push({ day: dayName, remaining });
    }
    return weekDays;
  };

  const remainingData = getRemainingTasksThisWeek();
  const completedData = progressData.map(item => ({ day: item.day, completed: item.completed }));
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const completedTasksByDate = tasks.filter(t => t.completed && t.dueDate);
  const dateCount = {};
  completedTasksByDate.forEach(task => { dateCount[task.dueDate] = (dateCount[task.dueDate] || 0) + 1; });
  let bestDay = "لا يوجد", maxCount = 0;
  Object.entries(dateCount).forEach(([date, count]) => { if (count > maxCount) { maxCount = count; bestDay = new Date(date).toLocaleDateString("ar-EG"); } });

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;

  const priorityCount = {
    عالية: tasks.filter(t => t.priority === "عالية").length,
    متوسطة: tasks.filter(t => t.priority === "متوسطة").length,
    منخفضة: tasks.filter(t => t.priority === "منخفضة").length,
  };
  const priorityData = Object.entries(priorityCount).map(([name, value]) => ({ name, value, color: name === "عالية" ? "var(--danger)" : name === "متوسطة" ? "var(--warning)" : "var(--secondary)" }));

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">نسبة الإنجاز</div><div className="stat-value">{completionRate}%</div><div className="stat-label">من إجمالي {total} مهمة</div></div>
        <div className="stat-card"><div className="stat-label">المهام المنجزة</div><div className="stat-value" style={{ color: "var(--secondary)" }}>{completed}</div></div>
        <div className="stat-card"><div className="stat-label">المهام المتأخرة</div><div className="stat-value" style={{ color: "var(--danger)" }}>{overdueCount}</div></div>
        <div className="stat-card"><div className="stat-label">أيام الإنتاجية القصوى</div><div className="stat-value" style={{ fontSize: "1.5rem" }}>{bestDay}</div><div className="stat-label">{maxCount} مهمة</div></div>
      </div>

      <div className="card"><h3 className="card-title">📈 تقدم المهام (آخر 7 أيام)</h3><ResponsiveContainer width="100%" height={300}><LineChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={{ fill: 'var(--text)' }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--text)' }} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ color: 'var(--text)' }} /><Line type="monotone" dataKey="completed" name="مهام منجزة" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer><p style={{ fontSize: "0.75rem", color: "var(--gray-600)", textAlign: "center", marginTop: "0.5rem" }}>عدد المهام التي أنجزتها يومياً خلال الأسبوع الماضي</p></div>
      <div className="card"><h3 className="card-title">⏳ المهام المتبقية هذا الأسبوع</h3><ResponsiveContainer width="100%" height={300}><BarChart data={remainingData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={{ fill: 'var(--text)' }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--text)' }} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ color: 'var(--text)' }} /><Bar dataKey="remaining" name="مهام متبقية" fill="var(--warning)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer><p style={{ fontSize: "0.75rem", color: "var(--gray-600)", textAlign: "center", marginTop: "0.5rem" }}>المهام غير المنجزة المخطط لها لكل يوم من هذا الأسبوع</p></div>
      <div className="card"><h3 className="card-title">✅ المهام المنجزة (آخر 7 أيام)</h3><ResponsiveContainer width="100%" height={300}><AreaChart data={completedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={{ fill: 'var(--text)' }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--text)' }} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ color: 'var(--text)' }} /><Area type="monotone" dataKey="completed" name="مهام منجزة" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth={2} /></AreaChart></ResponsiveContainer><p style={{ fontSize: "0.75rem", color: "var(--gray-600)", textAlign: "center", marginTop: "0.5rem" }}>توزيع المهام المنجزة خلال الأيام السبعة الماضية</p></div>
      <div className="card"><h3 className="card-title">🎯 توزيع المهام حسب الأولوية</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => `${value} مهمة`} contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} /><Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text)' }} /></PieChart></ResponsiveContainer><p style={{ fontSize: "0.75rem", color: "var(--gray-600)", textAlign: "center", marginTop: "0.5rem" }}>توزيع مهامك الحالية حسب درجة الأهمية</p></div>
      <div className="card"><h3 className="card-title">📊 إحصائيات الأولويات</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}><div><div className="stat-label">المهام ذات الأولوية العالية</div><div className="stat-value" style={{ fontSize: "1.8rem", color: "var(--danger)" }}>{priorityCount.عالية}</div></div><div><div className="stat-label">المهام ذات الأولوية المتوسطة</div><div className="stat-value" style={{ fontSize: "1.8rem", color: "var(--warning)" }}>{priorityCount.متوسطة}</div></div><div><div className="stat-label">المهام ذات الأولوية المنخفضة</div><div className="stat-value" style={{ fontSize: "1.8rem", color: "var(--secondary)" }}>{priorityCount.منخفضة}</div></div></div></div>
      <div className="card"><h3 className="card-title">📊 ملخص الإنجاز العام</h3><div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}><span>المهام المكتملة</span><span>{completed} / {total}</span></div><div style={{ background: "var(--gray-200)", borderRadius: "999px", height: "1rem", width: "100%", overflow: "hidden" }}><div style={{ width: `${completionRate}%`, background: "var(--primary)", height: "1rem", borderRadius: "999px", transition: "width 0.5s" }} /></div><p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>{completionRate === 100 ? "🏆 ممتاز! أنجزت جميع المهام." : `✅ اكتمل ${completionRate}% من المهام المخطط لها. استمر!`}</p></div>
    </div>
  );
};

export default Analytics;