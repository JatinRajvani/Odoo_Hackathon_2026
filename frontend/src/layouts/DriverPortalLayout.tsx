import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, LayoutDashboard, Route, History, User, LogOut } from 'lucide-react';

const DRIVER_NAV_ITEMS = [
  { to: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/driver/current-trip', label: 'Active Trip', icon: Route },
  { to: '/driver/trips', label: 'Trip History', icon: History },
  { to: '/driver/profile', label: 'Profile Settings', icon: User },
];

export default function DriverPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'DR';

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="icon-box"><Truck size={22} /></div>
          <div>
            <h2 style={{ margin: 0 }}>TransitOps</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Driver Portal
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {DRIVER_NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>
              {initials}
            </div>
            <div className="user-meta">
              <div className="email">{user?.email.split('@')[0]}</div>
              <div className="role-tag" style={{ color: 'var(--primary)', background: 'var(--primary-light)', fontWeight: 600 }}>
                DRIVER
              </div>
            </div>
            <button onClick={handleLogout} className="modal-close" title="Logout" style={{ flexShrink: 0 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="main-area" style={{ background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '1rem 2rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
