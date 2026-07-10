import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, Users, Wrench, LogOut, ClipboardCheck, ShieldUser, Eye } from 'lucide-react';
import { getRole, isOwner, isReadOnly, ROLE_LABELS, ROLE_BADGE } from '../utils/role';

export default function Layout({ user, onLogout }) {
  const isCompany = user?.role === 'company';
  const role = getRole();
  const owner = isOwner();
  const readOnly = isReadOnly();

  const companyMenuItems = [
    { path: '/dashboard', name: 'Makineler', icon: <LayoutDashboard size={20} /> },
    { path: '/forms', name: 'Kontrol Formları', icon: <ClipboardList size={20} /> },
    { path: '/technicians', name: 'Teknisyenler', icon: <Users size={20} /> },
    { path: '/is-emirleri', name: 'İş Emirleri', icon: <ClipboardCheck size={20} /> },
    { path: '/logs', name: 'Bakım Kayıtları', icon: <FileText size={20} /> },
    // Kullanıcılar yönetimi sadece sahip (owner) için.
    ...(owner ? [{ path: '/kullanicilar', name: 'Kullanıcılar', icon: <ShieldUser size={20} /> }] : []),
  ];

  const techMenuItems = [
    { path: '/dashboard', name: 'İş Raporu Gir', icon: <Wrench size={20} /> },
    { path: '/is-emirleri', name: 'İş Emirlerim', icon: <ClipboardCheck size={20} /> },
    { path: '/logs', name: 'Son İşlemlerim', icon: <FileText size={20} /> },
  ];

  const menuItems = isCompany ? companyMenuItems : techMenuItems;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1rem 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <h2 style={{ letterSpacing: '-0.05em' }}>Qimlik <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Dijital v1.7.10</span></h2>
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
            {isCompany ? (user?.staff ? 'Panel Kullanıcısı' : 'Firma Yetkilisi') : 'Aktif Teknisyen'}
          </div>
          <div style={{ fontWeight: 600, marginBottom: isCompany ? '0.5rem' : '1rem', fontSize: '0.95rem' }}>
            {isCompany ? (user?.staff?.name || user.company_name) : `${user.name} ${user.surname}`}
          </div>
          {isCompany && (
            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge ${ROLE_BADGE[role] || ''}`} style={{ fontWeight: 600 }}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: 'var(--status-error)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Eye size={16} /> İzleyici — salt-okunur. Bu hesap yalnızca görüntüleme yetkisine sahiptir.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
