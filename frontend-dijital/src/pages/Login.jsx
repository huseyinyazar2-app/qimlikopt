import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, Phone, Building2, User, QrCode, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { getApiUrl } from '../config';

export default function Login({ onLogin }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'technician' ? 'tech_login' : 'company_login';
  const [activeTab, setActiveTab] = useState(initialTab); // 'company_login', 'tech_login'
  
  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Tech verification states
  const [techStatus, setTechStatus] = useState('idle'); // 'idle', 'waiting', 'success'
  const [verifyDetails, setVerifyDetails] = useState(null); // { prefix, code, gateway_phone }
  const [timeLeft, setTimeLeft] = useState(180);

  const host = getApiUrl();

  // Countdown timer for technician WhatsApp verification
  useEffect(() => {
    if (techStatus !== 'waiting') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTechStatus('idle');
          toast.error('Doğrulama süresi doldu. Lütfen tekrar deneyin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [techStatus]);

  // Polling for technician WhatsApp verification status
  useEffect(() => {
    if (techStatus !== 'waiting' || !verifyDetails) return;
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`${host}/api/dijital/technician/login/status`, {
          params: { phone_number: phone, code: verifyDetails.code }
        });
        if (res.data.verified) {
          clearInterval(poll);
          setTechStatus('success');
          setTimeout(() => {
            onLogin({ ...res.data.technician, token: res.data.token, role: 'technician' });
          }, 1500);
        }
      } catch (err) {
        console.error('Doğrulama kontrol hatası:', err);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [techStatus, verifyDetails, phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'company_login') {
        const res = await axios.post(`${host}/api/dijital/company/login`, { phone_number: phone, password });
        onLogin({ ...res.data.company, token: res.data.token, role: 'company' });
      } else if (activeTab === 'tech_login') {
        const res = await axios.post(`${host}/api/dijital/technician/login/request`, { phone_number: phone });
        setVerifyDetails(res.data);
        setTechStatus('waiting');
        setTimeLeft(180);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bir hata oluştu. Bilgilerinizi kontrol edin.');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={36} color="var(--brand-primary)" />
            <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Qimlik</span>
            <span style={{ background: 'rgba(15,23,42,0.05)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>Dijital Bakım</span>
          </div>
          <p className="text-muted">Makine ve Ekipman QR Bakım Sistemi</p>
        </div>

        {/* Tab Selection */}
        {techStatus !== 'waiting' && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8, marginBottom: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => { setActiveTab('company_login'); }}
              style={{ flex: 1, padding: '0.6rem 0.2rem', borderRadius: 6, border: 'none', background: activeTab === 'company_login' ? 'var(--brand-gradient)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Firma Girişi
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('tech_login'); }}
              style={{ flex: 1, padding: '0.6rem 0.2rem', borderRadius: 6, border: 'none', background: activeTab === 'tech_login' ? 'var(--brand-gradient)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Teknisyen Girişi
            </button>
          </div>
        )}

        {techStatus === 'waiting' ? (
          /* WhatsApp Reverse OTP screen for technicians */
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>WhatsApp ile Giriş Yapın</h3>
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
                onClick={() => { setTechStatus('idle'); setVerifyDetails(null); }} 
                className="btn-outline" 
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Geri Dön ve Numarayı Değiştir
              </button>
            </div>
          </div>
        ) : techStatus === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--status-success)', fontWeight: 700 }}>Giriş Başarılı!</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Teknisyen paneline yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          /* Normal logins */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {activeTab === 'tech_login' ? 'Teknisyen Telefon Numarası' : 'Firma Telefon Numarası'}
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  required 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Örn: +905XXXXXXXXX"
                  style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            {activeTab !== 'tech_login' && (
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
                    style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, outline: 'none' }}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
              {loading ? 'İşlem yapılıyor...' : activeTab === 'tech_login' ? 'WhatsApp ile Giriş İste' : 'Giriş Yap'}
            </button>

            {activeTab === 'company_login' && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <span className="text-muted">Hesabınız yok mu? </span>
                <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Kayıt Olun</Link>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
