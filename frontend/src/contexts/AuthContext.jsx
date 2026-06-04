import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]);

  const extractToken = (data) => data?.data?.access_token || data?.access_token || data?.token || null;

  const fetchProfile = async () => {
    try {
      const profileResponse = await api.get('/auth/profile');
      const userData = profileResponse.data?.data?.user || profileResponse.data?.user || profileResponse.data;
      setUser(userData);

      const prefsResponse = await api.get('/preferences');
      setPreferences(prefsResponse.data?.data || prefsResponse.data || []);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    const prefsResponse = await api.get('/preferences');
    setPreferences(prefsResponse.data?.data || prefsResponse.data || []);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = extractToken(response.data);
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    await fetchProfile();
    return response.data;
  };

  const signup = async (name, email, password, password_confirmation) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: password_confirmation || password,
    });
    const token = extractToken(response.data);
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    await fetchProfile();
    return response.data;
  };

  const register = signup;

  const refreshToken = async () => {
    const response = await api.post('/auth/refresh');
    const token = extractToken(response.data);
    if (token) {
      localStorage.setItem('token', token);
    }
    return token;
  };

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

  const updateDayPreference = async (dayOfWeek, preferenceData) => {
    const response = await api.put('/preferences', {
      day_of_week: dayOfWeek,
      ...preferenceData,
    });
    await fetchPreferences();
    return response.data;
  };

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
    refreshToken,
    logout,
    updateDayPreference,
    deleteDayPreference,
    refreshPreferences: fetchPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);