import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState([]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:3303/api/admin/settings');
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
      await axios.put(`http://localhost:3303/api/admin/settings/${key}`, { value });
      alert('Ayar başarıyla kaydedildi.');
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Sistem Ayarları</h1>
        <p className="text-muted">Global güvenlik duvarları ve bakım modları.</p>
      </header>

      <div className="glass-card" style={{ maxWidth: 800 }}>
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
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', width: 200 }}
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
  );
}
