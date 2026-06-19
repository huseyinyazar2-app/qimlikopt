import { useState } from 'react';
import axios from 'axios';
import { KeyRound, Phone } from 'lucide-react';

export default function Login({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`http://${window.location.hostname}:3303/api/client/login`, { phone_number: phoneNumber, api_key: apiKey });
      onLogin(res.data.client);
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-gradient)', margin: '0 auto 1rem auto' }}></div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Qimlik</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Müşteri Yönetim Paneli</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Firma Telefon Numarası</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required 
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Örn: +905XXXXXXXXX"
                style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
