import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, MapPin, Users, CalendarDays, LogOut, Settings } from 'lucide-react';

export default function Layout({ user, onLogout }) {
  const isCompany = user?.role === 'company';

  const companyMenuItems = [
    { path: '/dashboard', name: 'Şantiyeler', icon: <MapPin size={20} /> },
    { path: '/employees', name: 'Çalışanlar', icon: <Users size={20} /> },
    { path: '/logs', name: 'Mesai Kayıtları', icon: <FileText size={20} /> },
    { path: '/settings', name: 'Ayarlar', icon: <Settings size={20} /> },
  ];

  const employeeMenuItems = [
    { path: '/dashboard', name: 'Mesai Giriş/Çıkış', icon: <CalendarDays size={20} /> },
    { path: '/logs', name: 'Giriş/Çıkışlarım', icon: <FileText size={20} /> },
  ];

  const menuItems = isCompany ? companyMenuItems : employeeMenuItems;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1rem 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <h2 style={{ letterSpacing: '-0.05em' }}>Qimlik <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Mesai v1.7.10</span></h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
          {menuItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
            {isCompany ? 'Firma Yetkilisi' : 'Saha Personeli'}
          </div>
          <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
            {isCompany ? user.company_name : `${user.name} ${user.surname}`}
          </div>
          <button 
            onClick={onLogout}
            style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer' }}
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
