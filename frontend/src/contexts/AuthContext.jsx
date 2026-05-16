import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]); // Array of daily preferences

  // Extract token from response (backend may return access_token or token)
  const extractToken = (data) => data?.access_token || data?.token || null;

  // Fetch user profile and preferences
  const fetchProfile = async () => {
    try {
      const profileResponse = await api.get('/auth/profile');
      setUser(profileResponse.data?.user || profileResponse.data);

      const prefsResponse = await api.get('/preferences');
      setPreferences(prefsResponse.data || []);
    } catch {
      // Token invalid - clear storage
      localStorage.removeItem('token');
      setUser(null);
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  };

  // Standalone fetch for preferences only
  const fetchPreferences = async () => {
    const prefsResponse = await api.get('/preferences');
    setPreferences(prefsResponse.data || []);
  };

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = extractToken(response.data);
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    await fetchProfile();
    return response.data;
  };

  // Register (signup)
  const signup = async (name, email, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: password,
    });
    const token = extractToken(response.data);
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    await fetchProfile();
    return response.data;
  };

  // Alias for consistency
  const register = signup;

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if request fails, clear local data
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setPreferences([]);
    }
  };

  // Update a specific day's preference
  const updateDayPreference = async (dayOfWeek, preferenceData) => {
    const response = await api.put('/preferences', {
      day_of_week: dayOfWeek,
      ...preferenceData,
    });
    await fetchPreferences();
    return response.data;
  };

  // Delete a specific day's preference
  const deleteDayPreference = async (dayOfWeek) => {
    await api.delete(`/preferences/${dayOfWeek}`);
    await fetchPreferences();
  };

  const value = {
    user,
    preferences,
    loading,
    login,
    signup,
    register,
    logout,
    updateDayPreference,
    deleteDayPreference,
    refreshPreferences: fetchPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);