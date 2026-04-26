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


const mapApiTaskToUi = (task) => {
  const priorityLabel = toPriorityLabel(Number(task.priority));
  let dueDate = '';
  let dueTime = '23:59';
  if (task.deadline) {
    const deadlineStr = String(task.deadline);
    const parts = deadlineStr.split('T');
    dueDate = parts[0] || '';
    if (parts[1]) {
      dueTime = parts[1].substring(0, 5);
    }
  }
  return {
    ...task,
    completed: task.status === 'completed',
    dueDate,
    dueTime,
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

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/tasks');
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


  const addTask = async (taskData) => {
    if (!taskData.dueDate) throw new Error('الموعد النهائي مطلوب');
    const time = taskData.dueTime || '23:59';
    const deadline = `${taskData.dueDate} ${time}:00`;
    const payload = {
      title: taskData.title,
      description: taskData.description || '',
      priority: toPriorityValue(taskData.priority),
      duration_minutes: taskData.duration,
      deadline: deadline,
      status: 'pending',
    };
    const response = await api.post('/tasks', payload);
    const newTask = mapApiTaskToUi(response.data);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  // ✅ Modified: update with time if dueDate changes
  const updateTask = async (id, updates) => {
    const payload = {
      title: updates.title,
      description: updates.description || '',
      priority: toPriorityValue(updates.priority),
      duration_minutes: updates.duration,
    };
    if (updates.dueDate) {
      const time = updates.dueTime || '23:59';
      payload.deadline = `${updates.dueDate} ${time}:00`;
    }
    const response = await api.put(`/tasks/${id}`, payload);
    const updatedTask = mapApiTaskToUi(response.data);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
    return updatedTask;
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleComplete = async (id, completed) => {
    const currentTask = tasks.find(task => task.id === id);
    const nextCompleted = typeof completed === 'boolean' ? completed : !(currentTask?.completed ?? false);
    const newStatus = nextCompleted ? 'completed' : 'pending';
    const response = await api.put(`/tasks/${id}`, { status: newStatus });
    const updatedTask = mapApiTaskToUi(response.data);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
  };

  const autoScheduleTask = async (id) => {
    const response = await api.post(`/tasks/${id}/auto-schedule`);
    await fetchTasks(); 
    return response.data;
  };

  const value = {
    tasks, loading, error,
    addTask, updateTask, deleteTask, toggleComplete, autoScheduleTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTasks = () => useContext(TaskContext);