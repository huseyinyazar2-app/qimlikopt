import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Code2, BookOpen, ExternalLink, LogOut } from 'lucide-react';

export default function Layout({ user, onLogout }) {
  const menuItems = [
    { path: '/dashboard', name: 'Genel Bakış', icon: <LayoutDashboard size={20} /> },
    { path: '/logs', name: 'İşlem Kayıtları', icon: <FileText size={20} /> },
    { path: '/api', name: 'API Bilgileri', icon: <Code2 size={20} /> },
    { path: '/integration', name: 'Nasıl Kullanılır?', icon: <BookOpen size={20} /> },
    { path: '/popup-guide', name: 'Açılır Pencere (Popup)', icon: <ExternalLink size={20} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar - Reusing Admin Sidebar Styles */}
      <aside className="sidebar">
        <div style={{ padding: '1rem 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <h2 style={{ letterSpacing: '-0.05em' }}>Qimlik <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Müşteri v1.7.6</span></h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
          <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>Hoşgeldiniz</div>
          <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{user?.company_name}</div>
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
