import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

const PRIORITY_LABEL_TO_VALUE = {
  'عالية': 1,
  'متوسطة': 3,
  'منخفضة': 5,
};

const PRIORITY_VALUE_TO_LABEL = {
  1: 'عالية',
  2: 'عالية',
  3: 'متوسطة',
  4: 'منخفضة',
  5: 'منخفضة',
};

const toPriorityValue = (label) => PRIORITY_LABEL_TO_VALUE[label] ?? 3;
const toPriorityLabel = (value) => PRIORITY_VALUE_TO_LABEL[value] ?? 'متوسطة';

const toLocalDateValue = (value) => {
  if (!value) return '';

  const rawValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return rawValue.slice(0, 10);
  }

  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const mapApiTaskToUi = (task) => {
  const priorityLabel = toPriorityLabel(Number(task.priority));

  return {
    ...task,
    completed: task.status === 'completed',
    dueDate: toLocalDateValue(task.deadline),
    duration: task.duration_minutes,
    priority: priorityLabel,
    priorityLabel,
  };
};

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks from Laravel whenever the user changes
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get('/tasks');
      // Laravel returns paginated data inside 'data'
      const tasksList = response.data.data || response.data;
      setTasks(tasksList.map(mapApiTaskToUi));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Add a new task
  const addTask = async (taskData) => {
    if (!taskData.dueDate) {
      throw new Error('الموعد النهائي مطلوب');
    }

    const payload = {
      title: taskData.title,
      description: taskData.description || '',
      priority: toPriorityValue(taskData.priority),
      duration_minutes: taskData.duration,
      deadline: taskData.dueDate,
      status: 'pending',
    };

    const response = await api.post('/tasks', payload);
    const newTask = mapApiTaskToUi(response.data);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  // Update an existing task
  const updateTask = async (id, updates) => {
    const payload = {
      title: updates.title,
      description: updates.description || '',
      priority: toPriorityValue(updates.priority),
      duration_minutes: updates.duration,
    };

    if (updates.dueDate) {
      payload.deadline = updates.dueDate;
    }

    const response = await api.put(`/tasks/${id}`, payload);
    const updatedTask = mapApiTaskToUi(response.data);
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updatedTask } : t
    ));
    return updatedTask;
  };

  // Delete a task
  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Toggle completed status
  const toggleComplete = async (id, completed) => {
    const currentTask = tasks.find((task) => task.id === id);
    const nextCompleted =
      typeof completed === 'boolean' ? completed : !(currentTask?.completed ?? false);
    const newStatus = nextCompleted ? 'completed' : 'pending';
    const response = await api.put(`/tasks/${id}`, { status: newStatus });
    const updatedTask = mapApiTaskToUi(response.data);
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updatedTask } : t
    ));
  };

  // NEW: Auto-schedule a single task
  const autoScheduleTask = async (id) => {
    const response = await api.post(`/tasks/${id}/auto-schedule`);
    // Refresh the task list to show updated slots
    await fetchTasks();
    return response.data;
  };

  const value = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    autoScheduleTask,   // <-- new function
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTasks = () => useContext(TaskContext);