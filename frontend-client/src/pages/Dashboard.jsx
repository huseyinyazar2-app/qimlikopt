import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, CheckCircle, XCircle, RefreshCw, QrCode, ArrowRight, Rocket, KeyRound, Webhook, PlayCircle, TrendingUp, Clock, Percent, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { getApiUrl } from '../config';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Analitik (trend + saatlik yoğunluk) durumu
  const [analytics, setAnalytics] = useState({ daily: [], hourly: [] });

  // WhatsApp Simulator State
  const [gatewayPhone, setGatewayPhone] = useState(() => {
    return localStorage.getItem('sim_gateway_phone') || '+905404234000';
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // 'waiting', 'success', 'failed'

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/api/client/${user.id}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoaded(true);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/api/client/${user.id}/analytics`);
      setAnalytics({
        daily: Array.isArray(res.data?.daily) ? res.data.daily : [],
        hourly: Array.isArray(res.data?.hourly) ? res.data.hourly : [],
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchAnalytics();
    }
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
          const res = await axios.get(`${getApiUrl()}/api/client/${user.id}/logs`);
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

  // --- Analitik verilerini grafiklere hazırla ---
  const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const formatDay = (isoDay) => {
    // '2026-07-10' -> '10 Tem'
    const parts = String(isoDay).split('-');
    if (parts.length !== 3) return isoDay;
    const m = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${TR_MONTHS[m] || ''}`.trim();
  };

  const dailyData = (analytics.daily || []).map((d) => ({
    day: formatDay(d.day),
    total: Number(d.total) || 0,
    success: Number(d.success) || 0,
  }));

  const totalSum = dailyData.reduce((a, b) => a + b.total, 0);
  const successSum = dailyData.reduce((a, b) => a + b.success, 0);
  const successRate = totalSum ? Math.round((successSum / totalSum) * 100) : 0;

  // Saatlik dağılımı 00-23 tam eksen olacak şekilde doldur
  const hourlyMap = {};
  (analytics.hourly || []).forEach((h) => {
    hourlyMap[String(h.hour).padStart(2, '0')] = Number(h.count) || 0;
  });
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hh = String(i).padStart(2, '0');
    return { hour: hh, count: hourlyMap[hh] || 0 };
  });
  const hasHourlyData = hourlyData.some((h) => h.count > 0);
  const hasDailyData = totalSum > 0;

  const chartTooltipStyle = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  };

  const EmptyChartState = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.6rem', height: 300, color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <BarChart2 size={40} style={{ opacity: 0.35 }} />
      <span style={{ fontSize: '0.9rem' }}>Henüz doğrulama verisi yok</span>
    </div>
  );

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Merhaba, {user?.company_name}</h1>
        <p className="text-muted">Aylık başarılı/başarısız OTP işlemlerini buradan takip edebilirsiniz.</p>
      </header>

      {/* Getting Started Card - only shown until the first verification arrives */}
      {statsLoaded && stats.total === 0 && (
        <div className="glass-card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Rocket size={24} style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Başlarken</h2>
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Qimlik OTP doğrulamasını sisteminize bağlamak için aşağıdaki üç adımı tamamlayın. İlk doğrulama geldiğinde bu kart otomatik olarak kaybolur.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              {
                num: 1,
                icon: <KeyRound size={20} />,
                title: 'Bilgilerinizi alın',
                desc: 'Firma ön ekinizi (prefix) ve API anahtarınızı görüntüleyin.',
                action: 'API Bilgilerine Git',
                to: '/api',
              },
              {
                num: 2,
                icon: <Webhook size={20} />,
                title: "Webhook'unuzu bağlayın",
                desc: "Doğrulanan kodların iletileceği webhook'unuzu entegre edin.",
                action: 'Entegrasyon Rehberi',
                to: '/integration',
              },
              {
                num: 3,
                icon: <PlayCircle size={20} />,
                title: 'İlk doğrulamayı test edin',
                desc: 'Açılır pencere akışıyla ilk doğrulamanızı canlı deneyin.',
                action: 'Testi Aç',
                to: '/popup-guide',
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(14, 165, 233, 0.1)',
                      color: 'var(--brand-primary)',
                      fontWeight: 700,
                    }}
                  >
                    {step.num}
                  </div>
                  <span style={{ color: 'var(--brand-primary)' }}>{step.icon}</span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.title}</div>
                <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {step.desc}
                </p>
                <button
                  onClick={() => navigate(step.to)}
                  className="btn-primary"
                  style={{
                    alignSelf: 'flex-start',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    padding: '0.5rem 1rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {step.action} <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Analitik Bölümü */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <BarChart2 size={22} style={{ color: 'var(--brand-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Analitik</h2>
        </div>

        {/* Trend grafiği + Başarı oranı KPI */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={20} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Doğrulama Hacmi (Son 30 Gün)</h3>
            </div>
            {/* Başarı Oranı KPI */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 1rem', borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-success)',
              }}>
                <Percent size={18} />
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Başarı Oranı</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--status-success)', lineHeight: 1.1 }}>
                  %{successRate}
                </div>
              </div>
            </div>
          </div>

          {hasDailyData ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--glass-border)' }} minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="total" name="Toplam" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradTotal)" />
                <Area type="monotone" dataKey="success" name="Başarılı" stroke="#10b981" strokeWidth={2} fill="url(#gradSuccess)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState />
          )}
        </div>

        {/* Saatlik yoğunluk */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <Clock size={20} style={{ color: 'var(--brand-secondary, #6366f1)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Saatlik Doğrulama Yoğunluğu (Son 7 Gün)</h3>
          </div>

          {hasHourlyData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--glass-border)' }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} labelFormatter={(h) => `${h}:00`} />
                <Bar dataKey="count" name="Doğrulama" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState />
          )}
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
                    background: 'rgba(255,255,255,0.8)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: 8, 
                    color: 'var(--text-primary)', 
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '1rem'
                  }}
                />
                <button 
                  onClick={generateNewCode} 
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.2rem', background: 'rgba(15,23,42,0.03)', boxShadow: 'none', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                >
                  <RefreshCw size={16} /> Kodu Yenile
                </button>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>
                * QR kod bu numaraya mesaj göndermek üzere yapılandırılmıştır.
              </span>
            </div>

            {/* Generated Message details */}
            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Gönderilecek Ön Ek:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{user?.prefix}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>OTP Kodu (Rastgele):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{otpCode}</span>
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
