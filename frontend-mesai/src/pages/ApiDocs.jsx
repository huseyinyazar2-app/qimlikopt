import { Copy, CheckCircle, Eye, EyeOff, Save, Lock } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function ApiDocs({ user, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert('Tüm alanları doldurmanız gerekmektedir.');
      return;
    }

    setUpdating(true);
    try {
      await axios.put(`http://${window.location.hostname}:3303/api/client/${user.id}/api-key`, {
        current_api_key: currentPassword,
        new_api_key: newPassword
      });
      
      alert('Şifreniz başarıyla değiştirildi. Lütfen yeni şifrenizle tekrar giriş yapın.');
      onLogout();
    } catch (err) {
      alert('Hata: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Hesap & Entegrasyon Bilgileri</h1>
        <p className="text-muted">Sisteminizi Qimlik'e bağlamak için gereken kimlik bilgileri ve şifre ayarlarınız.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: 800 }}>
        
        {/* API Info Card */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Erişim Bilgileriniz</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Atanan Prefix (Ön Ek)</div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--brand-primary)' }}>
                {user?.prefix}
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Kullanıcılarınız SMS metnine bu ön eki yazarak size kod gönderecektir. (Örn: {user?.prefix} 1234)
              </p>
            </div>

            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mevcut Şifre (API Key)</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type={showKey ? "text" : "password"} 
                  value={user?.api_key || ''} 
                  readOnly 
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', fontFamily: showKey ? 'monospace' : 'inherit' }}
                />
                <button 
                  onClick={() => setShowKey(!showKey)} 
                  className="btn-outline" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, padding: 0 }}
                  title={showKey ? "Gizle" : "Göster"}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button 
                  onClick={() => handleCopy(user?.api_key || '')} 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Kopyala
                </button>
              </div>
            </div>

            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Kayıtlı Webhook URL</div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }}>
                {user?.webhook_url}
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Doğrulanan kodlar bu adrese POST isteği olarak iletilir.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} color="var(--brand-primary)" /> Şifre Değiştir
          </h2>
          
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Mevcut Şifre</label>
                <input 
                  type="password" 
                  required
                  placeholder="Eski şifreniz"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Yeni Şifre</label>
                <input 
                  type="password" 
                  required
                  placeholder="Yeni şifreniz"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" disabled={updating} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Şifreyi Güncelle
            </button>
          </form>
        </div>

        {/* Webhook Payload Example */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Örnek Webhook Verisi (Payload)</h2>
          <div style={{ background: '#0d1117', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
            <button 
              onClick={() => handleCopy(`{\n  "prefix": "${user?.prefix}",\n  "user_phone": "+905xxxxxxxxx",\n  "code": "123456",\n  "full_message": "${user?.prefix} 123456",\n  "status": "verified"\n}`)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(15,23,42,0.05)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {copied ? <CheckCircle size={16} color="var(--status-success)" /> : <Copy size={16} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
            <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5' }}>
{`{
  "prefix": "${user?.prefix}",
  "user_phone": "+905xxxxxxxxx",
  "code": "123456",
  "full_message": "${user?.prefix} 123456",
  "status": "verified"
}`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
