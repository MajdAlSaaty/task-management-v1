import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TaskProvider } from '../contexts/TaskContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', label: 'الرئيسية', icon: '🏠' },
    { to: '/tasks', label: 'المهام', icon: '✅' },
    { to: '/analytics', label: 'تحليلات', icon: '📊' },
    { to: '/scheduler', label: 'جدولة ذكية', icon: '⏰' },
    { to: '/university', label: 'الجامعة', icon: '🎓' },
    { to: '/notifications', label: 'الإشعارات', icon: '🔔' },
    { to: '/conflicts', label: 'التعارضات', icon: '⚠️' },
    { to: '/preferences', label: 'تفضيلات الدراسة', icon: '⏰' },
    { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  ];

  return (
    <NotificationProvider>
      <TaskProvider>
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-header-top">
                <button
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  title={theme === 'light' ? 'تبديل إلى الوضع الداكن' : 'تبديل إلى الوضع الفاتح'}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <h2>مُساعِد المهام</h2>
                <NotificationBell />
              </div>
              <p className="tagline">ذكي · سريع · عصري</p>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'nav-link active' : 'nav-link'
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-footer">
              <button onClick={handleLogout} className="logout-button">
                <span>🚪</span> تسجيل الخروج
              </button>
            </div>
          </aside>

          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </TaskProvider>
    </NotificationProvider>
  );
};

export default Layout;