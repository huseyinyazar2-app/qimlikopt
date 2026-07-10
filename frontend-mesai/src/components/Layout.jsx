import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, MapPin, Users, CalendarDays, LogOut, Settings, Calculator, UserCog, Eye, Map } from 'lucide-react';
import { getRole, ROLE_LABELS, ROLE_COLORS, canSeeSettings, canSeePayroll, canManageUsers, isReadOnly } from '../utils/role';
import NotificationBell from './NotificationBell';

export default function Layout({ user, onLogout }) {
  const isCompany = user?.role === 'company';
  const role = getRole();
  const readOnly = isCompany && isReadOnly(role);

  const companyMenuItems = [
    { path: '/dashboard', name: 'Şantiyeler', icon: <MapPin size={20} />, show: true },
    { path: '/employees', name: 'Çalışanlar', icon: <Users size={20} />, show: true },
    { path: '/harita', name: 'Saha Haritası', icon: <Map size={20} />, show: true },
    { path: '/bordro', name: 'Bordro', icon: <Calculator size={20} />, show: canSeePayroll(role) },
    { path: '/logs', name: 'Mesai Kayıtları', icon: <FileText size={20} />, show: true },
    { path: '/settings', name: 'Ayarlar', icon: <Settings size={20} />, show: canSeeSettings(role) },
    { path: '/kullanicilar', name: 'Kullanıcılar', icon: <UserCog size={20} />, show: canManageUsers(role) },
  ].filter(i => i.show);

  const employeeMenuItems = [
    { path: '/dashboard', name: 'Mesai Giriş/Çıkış', icon: <CalendarDays size={20} /> },
    { path: '/logs', name: 'Giriş/Çıkışlarım', icon: <FileText size={20} /> },
  ];

  const menuItems = isCompany ? companyMenuItems : employeeMenuItems;
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.owner;

  return (
    <div className="admin-layout">
      {/* Bildirim zili — sadece firma paneli görünümünde */}
      {isCompany && <NotificationBell token={user?.token} />}

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {isCompany ? 'Firma Paneli' : 'Saha Personeli'}
            </span>
            {isCompany && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 999, background: roleColor.bg, color: roleColor.fg }}>
                {ROLE_LABELS[role] || 'Sahip'}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
            {isCompany
              ? (user.user_name ? user.user_name : user.company_name)
              : `${user.name} ${user.surname}`}
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
        {readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', marginBottom: '1.25rem', borderRadius: 8, background: ROLE_COLORS.viewer.bg, color: ROLE_COLORS.viewer.fg, fontSize: '0.85rem', fontWeight: 600 }}>
            <Eye size={16} /> İzleyici — salt-okunur mod. Değişiklik yapma yetkiniz yok.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
