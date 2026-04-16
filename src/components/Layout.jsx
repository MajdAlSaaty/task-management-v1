import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', label: 'الرئيسية', icon: '🏠' },
    { to: '/tasks', label: 'المهام', icon: '✅' },
    { to: '/scheduler', label: 'جدولة ذكية', icon: '⏰' },
    { to: '/university', label: 'الجامعة', icon: '🎓' },
    { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>مُساعِد المهام</h2>
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
  );
};

export default Layout;