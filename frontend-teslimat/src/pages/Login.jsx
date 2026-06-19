import { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, Phone, Building2, User, QrCode, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState('company_login'); // 'company_login', 'company_register', 'courier_login'
  
  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Courier verification states
  const [courierStatus, setCourierStatus] = useState('idle'); // 'idle', 'waiting', 'success'
  const [verifyDetails, setVerifyDetails] = useState(null); // { prefix, code, gateway_phone }
  const [timeLeft, setTimeLeft] = useState(180);

  const host = `http://${window.location.hostname}:3303`;

  // Countdown timer for courier WhatsApp verification
  useEffect(() => {
    if (courierStatus !== 'waiting') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCourierStatus('idle');
          setError('Doğrulama süresi doldu. Lütfen tekrar deneyin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [courierStatus]);

  // Polling for courier WhatsApp verification status
  useEffect(() => {
    if (courierStatus !== 'waiting' || !verifyDetails) return;
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`${host}/api/teslimat/courier/login/status`, {
          params: { phone_number: phone, code: verifyDetails.code }
        });
        if (res.data.verified) {
          clearInterval(poll);
          setCourierStatus('success');
          setTimeout(() => {
            onLogin({ ...res.data.courier, role: 'courier' });
          }, 1500);
        }
      } catch (err) {
        console.error('Doğrulama kontrol hatası:', err);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [courierStatus, verifyDetails, phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'company_login') {
        const res = await axios.post(`${host}/api/teslimat/company/login`, { phone_number: phone, password });
        onLogin({ ...res.data.company, role: 'company' });
      } else if (activeTab === 'company_register') {
        const res = await axios.post(`${host}/api/teslimat/company/register`, { company_name: companyName, phone_number: phone, password });
        onLogin({ ...res.data.company, role: 'company' });
      } else if (activeTab === 'courier_login') {
        const res = await axios.post(`${host}/api/teslimat/courier/login/request`, { phone_number: phone });
        setVerifyDetails(res.data);
        setCourierStatus('waiting');
        setTimeLeft(180);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const waMessage = verifyDetails ? `${verifyDetails.prefix} ${verifyDetails.code}` : '';
  const waLink = verifyDetails ? `https://wa.me/${verifyDetails.gateway_phone}?text=${encodeURIComponent(waMessage)}` : '';
  const qrCodeUrl = verifyDetails ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(waLink)}` : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifycontent: 'center', padding: '1rem', background: '#0f172a', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={36} color="var(--brand-primary)" />
            <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'white' }}>Qimlik</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>Teslimat</span>
          </div>
          <p className="text-muted">Güvenli ve İmzalı Paket Teslimat Sistemi</p>
        </div>

        {/* Tab Selection */}
        {courierStatus !== 'waiting' && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8, marginBottom: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => { setActiveTab('company_login'); setError(''); }}
              style={{ flex: 1, padding: '0.6rem 0.2rem', borderRadius: 6, border: 'none', background: activeTab === 'company_login' ? 'var(--brand-gradient)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Firma Girişi
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('company_register'); setError(''); }}
              style={{ flex: 1, padding: '0.6rem 0.2rem', borderRadius: 6, border: 'none', background: activeTab === 'company_register' ? 'var(--brand-gradient)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Kayıt Ol
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('courier_login'); setError(''); }}
              style={{ flex: 1, padding: '0.6rem 0.2rem', borderRadius: 6, border: 'none', background: activeTab === 'courier_login' ? 'var(--brand-gradient)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Kurye Girişi
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {courierStatus === 'waiting' ? (
          /* WhatsApp Reverse OTP screen for couriers */
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'white' }}>WhatsApp ile Giriş Yapın</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <strong>{phone}</strong> numaranızı doğrulamak için aşağıdaki QR kodu taratın veya doğrudan WhatsApp uygulamasını açın.
            </p>

            <div style={{ background: 'white', padding: '0.5rem', borderRadius: 8, display: 'inline-block', marginBottom: '1.25rem' }}>
              <img src={qrCodeUrl} alt="WhatsApp QR" style={{ width: 140, height: 140, display: 'block' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <a 
                href={waLink} 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', textDecoration: 'none', padding: '0.85rem' }}
              >
                <MessageSquare size={18} /> WhatsApp Uygulamasını Aç
              </a>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--brand-secondary)', fontWeight: 600, marginBottom: '1.5rem' }}>
              <Clock size={16} />
              Kalan Süre: {formatTime(timeLeft)}
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
              <button 
                onClick={() => { setCourierStatus('idle'); setVerifyDetails(null); }} 
                className="btn-outline" 
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Geri Dön ve Numarayı Değiştir
              </button>
            </div>
          </div>
        ) : courierStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--status-success)', fontWeight: 700 }}>Giriş Başarılı!</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Kurye zimmet arayüzüne yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          /* Normal logins */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeTab === 'company_register' && (
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Şirket Adı</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    required 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Örn: Aktaş Lojistik A.Ş."
                    style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {activeTab === 'courier_login' ? 'Kurye Telefon Numarası' : 'Firma Telefon Numarası'}
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  required 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Örn: +905XXXXXXXXX"
                  style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {activeTab !== 'courier_login' && (
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Şifre</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
              {loading ? 'İşlem yapılıyor...' : activeTab === 'company_register' ? 'Ücretsiz Kaydol' : activeTab === 'courier_login' ? 'WhatsApp ile Giriş İste' : 'Giriş Yap'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
