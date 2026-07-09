import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Lock, User } from 'lucide-react';
import { getApiUrl } from '../config';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [adminUser, setAdminUser] = useState(localStorage.getItem('qimlik_admin_username') || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [updatingCreds, setUpdatingCreds] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/api/admin/settings`);
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async (key, value) => {
    try {
      await axios.put(`${getApiUrl()}/api/admin/settings/${key}`, { value });
      alert('Ayar başarıyla kaydedildi.');
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!adminUser.trim()) {
      alert('Kullanıcı adı boş bırakılamaz.');
      return;
    }

    setUpdatingCreds(true);
    try {
      const currentSavedUsername = localStorage.getItem('qimlik_admin_username');
      if (adminUser !== currentSavedUsername) {
        await axios.put(`${getApiUrl()}/api/admin/settings/ADMIN_USERNAME`, { value: adminUser });
        localStorage.setItem('qimlik_admin_username', adminUser);
      }

      if (newPassword) {
        await axios.put(`${getApiUrl()}/api/admin/settings/ADMIN_PASSWORD`, { value: newPassword });
        alert('Giriş bilgileri başarıyla güncellendi. Yeni şifrenizle giriş yapmanız gerekiyor.');
        localStorage.removeItem('qimlik_admin_token');
        localStorage.removeItem('qimlik_admin_username');
        window.location.reload();
        return;
      }

      alert('Giriş bilgileri başarıyla güncellendi.');
    } catch (err) {
      alert('Giriş bilgileri güncellenirken hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingCreds(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Sistem Ayarları</h1>
        <p className="text-muted">Global güvenlik duvarları, bakım modları ve yönetici hesap ayarları.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 800 }}>
        
        {/* Admin Credentials Panel */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} color="var(--brand-primary)" /> Yönetici Giriş Bilgileri
          </h2>
          
          <form onSubmit={handleUpdateCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Kullanıcı Adı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={adminUser}
                    onChange={e => setAdminUser(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={updatingCreds} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Giriş Bilgilerini Güncelle
            </button>
          </form>
        </div>

        {/* Global Settings Panel */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Sistem Parametreleri</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {settings.map(setting => (
              <div key={setting.key} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.25rem' }}>{setting.key}</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{setting.description}</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={setting.value} 
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', width: 200 }}
                    />
                    <button onClick={() => handleSave(setting.key, setting.value)} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Save size={16} /> Kaydet
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {settings.length === 0 && <div className="text-muted">Ayar bulunamadı.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
