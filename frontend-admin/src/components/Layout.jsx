import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Smartphone, FileText, Settings, LogOut } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

export default function Layout({ username, onLogout }) {
  const [systemOnline, setSystemOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/health`);
        if (!cancelled) setSystemOnline(res.data?.status === 'UP');
      } catch {
        if (!cancelled) setSystemOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const statusColor = systemOnline ? 'var(--status-success)' : 'var(--status-error)';
  const statusText = systemOnline === null
    ? 'Kontrol ediliyor...'
    : (systemOnline ? 'Sistem Çalışıyor' : 'Bağlantı Yok');

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/clients', name: 'Müşteriler', icon: <Users size={20} /> },
    { path: '/devices', name: 'Cihazlar', icon: <Smartphone size={20} /> },
    { path: '/logs', name: 'Kayıtlar', icon: <FileText size={20} /> },
    { path: '/settings', name: 'Ayarlar', icon: <Settings size={20} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '1rem 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <h2 style={{ letterSpacing: '-0.05em' }}>Qimlik <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Admin v1.7.10</span></h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>Aktif Yönetici</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>{username}</div>
            <button 
              onClick={onLogout}
              style={{ width: '100%', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
            >
              <LogOut size={14} /> Çıkış Yap
            </button>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 4 }}>Sistem Durumu</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: statusColor, fontWeight: 500 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></div>
              {statusText}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
