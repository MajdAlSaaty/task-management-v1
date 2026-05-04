import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState([]);  

   const extractToken = (data) => data?.access_token || data?.token || null;

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

  const register = signup;

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
    // Refresh preferences
    const prefsResponse = await api.get('/preferences');
    setPreferences(prefsResponse.data || []);
    return response.data;
  };

    const deleteDayPreference = async (dayOfWeek) => {
    await api.delete(`/preferences/${dayOfWeek}`);
    const prefsResponse = await api.get('/preferences');
    setPreferences(prefsResponse.data || []);
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
    refreshPreferences: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);