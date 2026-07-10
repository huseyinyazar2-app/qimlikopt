import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, Smartphone, AlertCircle, CheckCircle, AlertTriangle, Rocket, ArrowRight, TrendingUp, BarChart3, UserCheck } from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { getApiUrl } from '../config';

// Marka renkleri ve açık "glass" temaya uygun grafik renkleri
const CHART = {
  total: '#0ea5e9',
  success: '#6366f1',
  axis: '#64748b',       // --text-muted
  grid: 'rgba(15, 23, 42, 0.08)', // --glass-border
};

const chartTooltipStyle = {
  background: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: 10,
  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
  color: '#0f172a',
  fontSize: '0.8rem',
};

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, devices: 0, logs: 0 });
  const [devicesList, setDevicesList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseUtcDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const normalizedStr = dateStr.endsWith('Z') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    return new Date(normalizedStr);
  };

  const isOffline = (lastSeen) => {
    const diff = new Date() - parseUtcDate(lastSeen);
    return diff > 5 * 60 * 1000;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cRes, dRes, lRes] = await Promise.all([
          axios.get(`${getApiUrl()}/api/admin/clients`),
          axios.get(`${getApiUrl()}/api/admin/devices`),
          axios.get(`${getApiUrl()}/api/admin/logs`)
        ]);
        setStats({
          clients: cRes.data.length,
          devices: dRes.data.length,
          logs: lRes.data.length
        });
        setDevicesList(dRes.data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Analitik verisi ayrı çekilir; hata olsa bile mevcut kartlar çalışmaya devam eder
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/api/admin/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      }
    };
    fetchAnalytics();
  }, []);

  const totalDevices = devicesList.length;
  const offlineDevices = devicesList.filter(d => isOffline(d.last_seen)).length;
  const onlineDevices = totalDevices - offlineDevices;

  const renderAlertCard = () => {
    if (loading) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid var(--glass-border)' }}>
          <div className="text-muted">Durum hesaplanıyor...</div>
        </div>
      );
    }

    if (totalDevices === 0) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 8, borderLeft: '3px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle color="#f59e0b" size={20} />
          <div>
            <div style={{ fontWeight: 600, color: '#f59e0b' }}>Bağlı Gateway Bulunmuyor</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Sistemde kayıtlı gateway cihazı bulunamadı. Lütfen Android APK üzerinden heartbeat gönderin.</div>
          </div>
        </div>
      );
    }

    if (offlineDevices > 0) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle color="var(--status-error)" size={20} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--status-error)' }}>{offlineDevices} Gateway Cihazı Çevrimdışı!</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Bağlantı kesintisi algılandı. Lütfen cihazların internet ve servis durumunu kontrol edin.</div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CheckCircle color="var(--status-success)" size={20} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--status-success)' }}>Tüm Gateway Cihazları Çevrimiçi</div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Şu anda aktif {onlineDevices} cihaz sorunsuz çalışıyor.</div>
        </div>
      </div>
    );
  };

  const formatDay = (day) => {
    if (!day) return '';
    // "YYYY-MM-DD" veya "YYYY-MM-DD ..." formatını "GG.AA" olarak göster
    const d = new Date(String(day).replace(' ', 'T'));
    if (isNaN(d.getTime())) return String(day).slice(5); // güvenli geri dönüş
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    const daily = Array.isArray(analytics.daily) ? analytics.daily : [];
    const topClients = Array.isArray(analytics.top_clients) ? analytics.top_clients : [];
    const summary = analytics.summary || {};

    const dailyData = daily.map((d) => ({
      label: formatDay(d.day),
      total: Number(d.total) || 0,
      success: Number(d.success) || 0,
    }));

    const topData = topClients.map((c) => ({
      name: c.company_name || c.prefix || '—',
      prefix: c.prefix,
      count: Number(c.count) || 0,
    }));

    const totalClients = Number(summary.clients) || 0;
    const activeClients = Number(summary.active_clients) || 0;
    const passiveClients = Math.max(totalClients - activeClients, 0);
    const activeRatio = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
    const totalLogs = Number(summary.total_logs) || 0;

    return (
      <>
        {/* Özet KPI kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', color: 'var(--brand-primary)' }}>
              <UserCheck size={32} />
            </div>
            <div>
              <div className="text-muted">Aktif / Pasif Müşteri</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{activeClients} / {passiveClients}</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>Aktiflik oranı: %{activeRatio}</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
              <TrendingUp size={32} />
            </div>
            <div>
              <div className="text-muted">Toplam İşlem (Log)</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalLogs.toLocaleString('tr-TR')}</div>
            </div>
          </div>
        </div>

        {/* Trend grafiği: Sistem işlem hacmi */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Activity size={20} color="var(--brand-primary)" /> Sistem İşlem Hacmi (Son 30 Gün)
          </h2>
          {dailyData.length === 0 ? (
            <div className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
              Henüz görüntülenecek işlem verisi yok.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.total} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART.total} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.success} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: CHART.grid }} minTickGap={16} />
                <YAxis tick={{ fill: CHART.axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#64748b', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', color: CHART.axis }} />
                <Area type="monotone" dataKey="total" name="Toplam" stroke={CHART.total} strokeWidth={2} fill="url(#gradTotal)" />
                <Area type="monotone" dataKey="success" name="Başarılı" stroke={CHART.success} strokeWidth={2} fill="url(#gradSuccess)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* En aktif müşteriler */}
        {topData.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
              <BarChart3 size={20} color="#6366f1" /> En Aktif Müşteriler
            </h2>
            <ResponsiveContainer width="100%" height={Math.max(topData.length * 44, 180)}>
              <BarChart data={topData} layout="vertical" margin={{ top: 5, right: 24, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: CHART.grid }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: CHART.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={140} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} labelStyle={{ color: '#64748b', fontWeight: 600 }} />
                <Bar dataKey="count" name="İşlem" fill={CHART.success} radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Genel Bakış</h1>
        <p className="text-muted">Sistem durumunu ve istatistikleri buradan takip edebilirsiniz.</p>
      </header>

      {/* Getting Started (only when no clients yet) */}
      {!loading && stats.clients === 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '3px solid var(--brand-primary)' }}>
          <h2 style={{ marginBottom: '0.35rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Rocket size={20} color="var(--brand-primary)" /> Başlarken
          </h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Paneli kullanmaya başlamak için aşağıdaki adımları izleyin.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {gettingStartedSteps.map((step) => (
              <Link
                key={step.n}
                to={step.to}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(15, 23, 42, 0.02)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--brand-gradient)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {step.title} <ArrowRight size={14} className="text-muted" />
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: 2, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--brand-primary)' }}>
            <Users size={32} />
          </div>
          <div>
            <div className="text-muted">Aktif Müşteriler</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.clients}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--status-success)' }}>
            <Smartphone size={32} />
          </div>
          <div>
            <div className="text-muted">Bağlı Cihazlar</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{onlineDevices} / {totalDevices}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
            <Activity size={32} />
          </div>
          <div>
            <div className="text-muted">Toplam İşlenen SMS</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.logs}</div>
          </div>
        </div>
      </div>

      {/* Analitik Bölümü */}
      {renderAnalytics()}

      {/* Recent Activity Card */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} className="text-muted" /> Sistem Durum Bildirimleri
        </h2>
        {renderAlertCard()}
      </div>
    </div>
  );
}

const gettingStartedSteps = [
  { n: 1, to: '/clients', title: 'İlk müşterinizi ekleyin', desc: 'OTP hizmeti alacak firmayı ve Prefix bilgisini tanımlayın.' },
  { n: 2, to: '/devices', title: 'Gateway cihazını bağlayın', desc: 'Android gateway uygulamasını sunucuya bağlayın.' },
  { n: 3, to: '/logs', title: 'Loglarınızı izleyin', desc: 'Doğrulama ve OTP işlem kayıtlarını buradan takip edin.' },
];
