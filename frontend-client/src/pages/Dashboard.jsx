import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, CheckCircle, XCircle, RefreshCw, Smartphone, QrCode, ArrowRight } from 'lucide-react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0 });

  // WhatsApp Simulator State
  const [gatewayPhone, setGatewayPhone] = useState(() => {
    return localStorage.getItem('sim_gateway_phone') || '+905303700589';
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // 'waiting', 'success', 'failed'

  const fetchStats = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3303/api/client/${user.id}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) fetchStats();
  }, [user]);

  // Generate unique OTP Code
  const generateNewCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setVerificationStatus('waiting');
  };

  useEffect(() => {
    generateNewCode();
  }, []);

  // Save Gateway Phone to localStorage
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setGatewayPhone(val);
    localStorage.setItem('sim_gateway_phone', val);
  };

  // Poll logs to check if the OTP code has been verified
  useEffect(() => {
    let intervalId;
    if (verificationStatus === 'waiting' && otpCode && user?.id) {
      intervalId = setInterval(async () => {
        try {
          const res = await axios.get(`http://${window.location.hostname}:3303/api/client/${user.id}/logs`);
          const logs = res.data;
          
          const targetMsg = `${user.prefix} ${otpCode}`.toUpperCase();
          const match = logs.find(log => log.message_body?.toUpperCase() === targetMsg);
          
          if (match) {
            if (match.status === 'success') {
              setVerificationStatus('success');
              fetchStats(); // Update stats cards instantly!
            } else {
              setVerificationStatus('failed');
            }
          }
        } catch (err) {
          console.error("Error polling logs:", err);
        }
      }, 2000); // Check every 2 seconds
    }
    return () => clearInterval(intervalId);
  }, [verificationStatus, otpCode, user]);

  // Clean phone number for wa.me URL
  const cleanPhone = gatewayPhone.replace(/[^0-9]/g, '');
  const waMessage = `${user?.prefix} ${otpCode}`;
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waLink)}`;

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Merhaba, {user?.company_name}</h1>
        <p className="text-muted">Aylık başarılı/başarısız OTP işlemlerini buradan takip edebilirsiniz.</p>
      </header>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--brand-primary)' }}>
            <MessageSquare size={32} />
          </div>
          <div>
            <div className="text-muted">Toplam İşlem</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--status-success)' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div className="text-muted">Başarılı İşlem</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.successful}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--status-error)' }}>
            <XCircle size={32} />
          </div>
          <div>
            <div className="text-muted">Başarısız/Hatalı</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* WhatsApp QR OTP Simulator Section */}
      <div className="glass-card" style={{ maxWidth: 850, padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <QrCode size={24} style={{ color: 'var(--brand-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>WhatsApp OTP QR Kod Simülatörü (wa.me)</h2>
        </div>

        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          Müşterilerinizin tarayıp doğrulama yapacağı QR kod akışını yerel test cihazınızla deneyin. Aşağıdaki telefon numarasına WhatsApp uygulaması yüklü ve Qimlik Gateway aktif olan test cihazınızın numarasını girin.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          {/* Left Column: QR Code Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
            <div style={{ 
              background: 'white', 
              padding: '12px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '2px dashed var(--brand-primary)'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="WhatsApp QR Code" 
                style={{ width: 180, height: 180, display: 'block' }} 
              />
            </div>
            
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
            >
              Cihazdan Doğrudan Aç <ArrowRight size={16} />
            </a>
          </div>

          {/* Right Column: Setup & Live Verification Status */}
          <div style={{ flex: '2 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Target Phone Setup */}
            <div>
              <label className="text-muted" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Test Cihazı WhatsApp Numarası (Ülke kodu ile)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  value={gatewayPhone}
                  onChange={handlePhoneChange}
                  placeholder="+905xxxxxxxxx"
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: 8, 
                    color: 'white', 
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '1rem'
                  }}
                />
                <button 
                  onClick={generateNewCode} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.2rem', background: 'rgba(255,255,255,0.05)', boxShadow: 'none', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                >
                  <RefreshCw size={16} /> Kodu Yenile
                </button>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                * QR kod bu numaraya mesaj göndermek üzere yapılandırılmıştır.
              </span>
            </div>

            {/* Generated Message details */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Gönderilecek Ön Ek:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{user?.prefix}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>OTP Kodu (Rastgele):</span>
                <span style={{ fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{otpCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Hazır Mesaj Metni:</span>
                <span style={{ fontWeight: 600, color: '#10b981', fontFamily: 'monospace' }}>{waMessage}</span>
              </div>
            </div>

            {/* Live Status Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: 8, 
              background: verificationStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : verificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.05)',
              border: `1px solid ${verificationStatus === 'success' ? '#10b981' : verificationStatus === 'failed' ? '#ef4444' : '#eab308'}`
            }}>
              {verificationStatus === 'waiting' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                  <div className="status-ping-dot"></div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#eab308' }}>Sinyal Bekleniyor...</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      QR kodu taratıp test cihazınıza WhatsApp mesajı gönderin.
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={24} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>Doğrulama Başarılı!</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Mesaj yakalandı, backend'e iletildi ve webhook başarıyla tetiklendi.
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <XCircle size={24} style={{ color: '#ef4444' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>Doğrulama Hatası!</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Mesaj alındı fakat işlem başarısız oldu. Log detaylarını inceleyin.
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
