import { useMemo } from 'react';
import './Timeline.css';

const HOUR_START = 6;
const HOUR_END = 23;
const PIXELS_PER_HOUR = 60;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

const DAYS_ARABIC = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const getWeekDates = (date) => {
  const monday = getMonday(new Date(date));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const formatDateKey = (date) => {
  if (typeof date === 'string') date = new Date(date);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getSlotStyle = (startTime, endTime) => {
  const startD = new Date(startTime);
  const endD = new Date(endTime);
  const startMin = startD.getHours() * 60 + startD.getMinutes() - HOUR_START * 60;
  const endMin = endD.getHours() * 60 + endD.getMinutes() - HOUR_START * 60;
  const top = Math.max(0, (startMin / 60) * PIXELS_PER_HOUR);
  const height = Math.max(16, ((endMin - startMin) / 60) * PIXELS_PER_HOUR);
  return { top, height };
};

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

const getColor = (taskId) => COLORS[Number(taskId) % COLORS.length];

const Timeline = ({ slots, view, selectedDate }) => {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const daySlots = useMemo(() => {
    const dateKey = formatDateKey(selectedDate);
    return slots.filter(s => formatDateKey(s.start_time) === dateKey);
  }, [slots, selectedDate]);

  const weekSlotsByDay = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[formatDateKey(d)] = []; });
    slots.forEach(s => {
      const key = formatDateKey(s.start_time);
      if (map[key]) map[key].push(s);
    });
    return map;
  }, [slots, weekDates]);

  const isToday = (date) => formatDateKey(new Date()) === formatDateKey(date);

  if (slots.length === 0) {
    return (
      <div className="timeline-empty">
        <p>لا توجد مهام مجدولة</p>
      </div>
    );
  }

  if (view === 'day') {
    return (
      <div className="timeline-day-view">
        <div className="timeline-labels">
          {HOURS.map(h => (
            <div key={h} className="timeline-hour-label">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div className="timeline-track">
          {HOURS.map(h => (
            <div key={h} className="timeline-track-hour" />
          ))}
          {daySlots.map(slot => {
            const style = getSlotStyle(slot.start_time, slot.end_time);
            const color = getColor(slot.task_id);
            return (
              <div
                key={slot.id}
                className="timeline-slot"
                style={{ ...style, background: color }}
              >
                <div className="timeline-slot-title">{slot.task?.title || 'مهمة'}</div>
                <div className="timeline-slot-time">
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-week-view">
      <div className="timeline-week-header">
        <div className="timeline-week-spacer" />
        {weekDates.map(date => (
          <div
            key={formatDateKey(date)}
            className={`timeline-week-day-header ${isToday(date) ? 'today' : ''}`}
          >
            {DAYS_ARABIC[date.getDay()]}
            <br />
            <small>{date.getDate()}</small>
          </div>
        ))}
      </div>
      <div className="timeline-week-body">
        <div className="timeline-labels">
          {HOURS.map(h => (
            <div key={h} className="timeline-hour-label">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        <div className="timeline-week-cols">
          {weekDates.map(date => {
            const dateKey = formatDateKey(date);
            const daySlots = weekSlotsByDay[dateKey] || [];
            const today = isToday(date);
            return (
              <div
                key={dateKey}
                className={`timeline-week-col ${today ? 'today' : ''}`}
              >
                {HOURS.map(h => (
                  <div key={h} className="timeline-week-col-hour" />
                ))}
                {daySlots.map(slot => {
                  const style = getSlotStyle(slot.start_time, slot.end_time);
                  const color = getColor(slot.task_id);
                  return (
                    <div
                      key={slot.id}
                      className="timeline-slot"
                      style={{ ...style, background: color }}
                    >
                      <div className="timeline-slot-title">{slot.task?.title || 'مهمة'}</div>
                      <div className="timeline-slot-time">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { getWeekDates, formatDateKey, getMonday };
export default Timeline;