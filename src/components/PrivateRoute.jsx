import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>;
  }
  
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default PrivateRoute;