import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, MapPin, Users, CalendarDays, LogOut, Package, Truck, AlertTriangle, Award, Eye, UserCog, Map } from 'lucide-react';
import { getRole, isOwner, isReadOnly, roleLabel } from '../utils/role';
import NotificationCenter from './NotificationCenter';

export default function Layout({ user, onLogout }) {
  const isCompany = user?.role === 'company';
  const role = getRole();
  const owner = isOwner();
  const readOnly = isReadOnly();

  const companyMenuItems = [
    { path: '/dashboard', name: 'Teslimat Takip', icon: <MapPin size={20} /> },
    { path: '/couriers', name: 'Kurye Yönetimi', icon: <Truck size={20} /> },
    { path: '/packages', name: 'Paket Yönetimi', icon: <Package size={20} /> },
    { path: '/basarisiz', name: 'Başarısız Teslimler', icon: <AlertTriangle size={20} /> },
    { path: '/karne', name: 'Kurye Karnesi', icon: <Award size={20} /> },
    { path: '/harita', name: 'Rota Haritası', icon: <Map size={20} /> },
    // Kullanıcı yönetimi sadece firma sahibine görünür
    ...(owner ? [{ path: '/kullanicilar', name: 'Kullanıcılar', icon: <UserCog size={20} /> }] : []),
  ];

  const courierMenuItems = [
    { path: '/dashboard', name: 'Zimmetli Paketlerim', icon: <Package size={20} /> },
  ];

  const menuItems = isCompany ? companyMenuItems : courierMenuItems;
  // Panel personeli için görünecek isim: personel adı varsa onu, yoksa firma adını göster
  const displayName = isCompany ? (user.staff?.name || user.company_name) : `${user.name} ${user.surname}`;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1rem 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <h2 style={{ letterSpacing: '-0.05em' }}>Qimlik <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Teslimat v1.7.10</span></h2>
        </div>

        {/* İzleyici (salt-okunur) rozeti */}
        {isCompany && readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', marginBottom: '0.75rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>
            <Eye size={16} /> İzleyici — salt-okunur
          </div>
        )}

        {/* Bildirim merkezi — sadece firma panelinde */}
        {isCompany && (
          <div style={{ marginBottom: '0.75rem' }}>
            <NotificationCenter user={user} />
          </div>
        )}

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
          <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {isCompany ? 'Firma Paneli' : 'Kurye Personeli'}
            {isCompany && <span className="badge" style={{ background: 'rgba(15,23,42,0.06)', fontSize: '0.7rem' }}>{roleLabel(role)}</span>}
          </div>
          <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
            {displayName}
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
