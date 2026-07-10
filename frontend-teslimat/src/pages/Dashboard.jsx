import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { 
  Package, 
  Search,
  Command,
  Box,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  ExternalLink,
  User,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  Users,
  Rocket,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { getApiUrl } from '../config';

export default function Dashboard({ user }) {
  const isCompany = user?.role === 'company';

  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const [showCmd, setShowCmd] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');

  // Simulation states
  const [selectedPackId, setSelectedPackId] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');

  const host = getApiUrl();
  const token = user?.token;

  // Sadece geliştirici modunda (yerelde) görünsün; canlıda (qimlik.com) gizle.
  const isDevMode = typeof window !== 'undefined' && !window.location.hostname.endsWith('qimlik.com');

  const fetchCompanyData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resP = await axios.get(`${host}/api/teslimat/packages`, { headers });
      setPackages(resP.data);

      const resC = await axios.get(`${host}/api/teslimat/couriers`, { headers });
      setCouriers(resC.data.filter(c => c.is_active));

      // Analitik verilerini çek (grafikler bozulsa da panel çalışmaya devam etsin)
      try {
        const resA = await axios.get(`${host}/api/teslimat/company/analytics`, { headers });
        setAnalytics(resA.data);
      } catch (analyticsErr) {
        setAnalytics(null);
      }

      // Auto-select first elements for simulator dropdowns
      const pendingPacks = resP.data.filter(p => p.status !== 'delivered');
      if (pendingPacks.length > 0) setSelectedPackId(pendingPacks[0].id.toString());
      if (resC.data.length > 0) setSelectedCourierId(resC.data[0].id.toString());
    } catch (err) {
      toast.error('Firma verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourierData = async () => {
    try {
      const res = await axios.get(`${host}/api/teslimat/courier/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(res.data);
    } catch (err) {
      toast.error('Kurye paketleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCompany) {
      fetchCompanyData();
    } else {
      fetchCourierData();
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd(true);
      }
      if (e.key === 'Escape') setShowCmd(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (!selectedPackId) return;
    window.open(`/deliver/${selectedPackId}`, '_blank');
  };

  const countPackages = (status) => {
    return packages.filter(p => p.status === status).length;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
        <p className="text-muted">Dashboard yükleniyor...</p>
      </div>
    );
  }

  if (!isCompany) {
    /* --- COURIER DASHBOARD: ZİMMETLİ GÖNDERİLER --- */
    const transitPacks = packages.filter(p => p.status === 'in_transit');
    const deliveredPacks = packages.filter(p => p.status === 'delivered');

    return (
      <div style={{ maxWidth: '900px' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="gradient-text">Hoş Geldiniz, Kurye {user.name}!</h1>
          <p className="text-muted">Size zimmetlenen paketleri ve dağıtım teslimat onay süreçlerini buradan yönetin.</p>
        </header>

        {/* Courier statistics summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dağıtımdaki Paketlerim</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{transitPacks.length} Paket</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bugün Teslim Edilenler</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{deliveredPacks.length} Paket</div>
            </div>
          </div>
        </div>

        {/* Courier Packages list */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={18} color="var(--brand-primary)" /> Güncel Zimmet Listesi
          </h3>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Takip Kodu</th>
                  <th>Alıcı Adı</th>
                  <th>Telefon</th>
                  <th>Adres</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{p.package_code}</span>
                    </td>
                    <td><strong>{p.recipient_name}</strong></td>
                    <td style={{ fontSize: '0.85rem' }}>{p.recipient_phone}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.delivery_address}>
                      {p.delivery_address}
                    </td>
                    <td>
                      {p.status === 'delivered' ? (
                        <span className="badge success">Teslim Edildi</span>
                      ) : (
                        <a 
                          href={`/deliver/${p.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-primary" 
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          Teslimatı Başlat <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Size atanmış herhangi bir teslimat kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* --- COMPANY DASHBOARD --- */
  const inTransitCount = countPackages('in_transit');
  const deliveredCount = countPackages('delivered');

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">{user.company_name} Dağıtım Takip Paneli</h1>
        <p className="text-muted">Zimmet durumlarını, kurye koordinat teslimat loglarını ve teslimat kanıtlarını izleyin.</p>
      </header>

      {/* Getting started guide: only when there is no data yet */}
      {packages.length === 0 && couriers.length === 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--brand-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Rocket size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>Başlarken</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Sistemi kullanmaya başlamak için şu 3 adımı tamamlayın.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            {[
              { n: 1, to: '/couriers', icon: <Users size={18} />, title: 'Kurye ekleyin', desc: 'Paketleri zimmetleyeceğiniz kurye personelini tanımlayın.', action: 'Kurye Yönetimi' },
              { n: 2, to: '/packages', icon: <Package size={18} />, title: 'Paket / gönderi oluşturun', desc: 'Alıcı ve adres bilgileriyle ilk teslimat gönderinizi kaydedin.', action: 'Paket Yönetimi' },
              { n: 3, to: '/packages', icon: <Truck size={18} />, title: 'Paketi kuryeye zimmetleyin', desc: 'Gönderiyi aktif bir kuryeye atayın; dağıtım süreci başlasın.', action: 'Zimmetle' },
            ].map(step => (
              <Link
                key={step.n}
                to={step.to}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.6)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>{step.n}</span>
                  <span style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center' }}>{step.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{step.title}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: 0 }}>{step.desc}</p>
                <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontSize: '0.82rem', fontWeight: 600, paddingTop: '0.25rem' }}>
                  {step.action} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ANALİTİK BÖLÜMÜ */}
      <AnalyticsSection analytics={analytics} />

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Toplam Paket Gönderisi</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{packages.length} Gönderi</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Yolda / Dağıtımda</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{inTransitCount} Paket</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Başarıyla Teslim Edilen</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{deliveredCount} Paket</div>
          </div>
        </div>
        
        {packages.length > 0 && (
          <div className="glass-card" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={[
                     { name: 'Teslim Edildi', value: deliveredCount, color: '#10b981' },
                     { name: 'Yolda', value: inTransitCount, color: '#f59e0b' },
                     { name: 'Bekliyor', value: packages.length - deliveredCount - inTransitCount, color: '#64748b' }
                   ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40}>
                   {
                     [
                       { name: 'Teslim Edildi', value: deliveredCount, color: '#10b981' },
                       { name: 'Yolda', value: inTransitCount, color: '#f59e0b' },
                       { name: 'Bekliyor', value: packages.length - deliveredCount - inTransitCount, color: '#64748b' }
                     ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                   }
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDevMode ? '1.3fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Left column: Company Packages list */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={18} color="var(--brand-primary)" /> Son Gönderiler & Teslimat Kanıtları
          </h3>

          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Takip No</th>
                  <th>Alıcı</th>
                  <th>Kurye</th>
                  <th>Durum</th>
                  <th>Konum Kanıtı</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{p.package_code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.recipient_name}</div>
                      <div style={{ fontSize: '0.75rem' }} className="text-muted">{p.recipient_phone}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.courier_name || 'Atanmamış'}</td>
                    <td>
                      <span className={`badge ${p.status === 'delivered' ? 'success' : p.status === 'in_transit' ? 'warning' : 'secondary'}`}>
                        {p.status === 'delivered' ? 'Teslim Edildi' : p.status === 'in_transit' ? 'Dağıtımda' : 'Beklemede'}
                      </span>
                    </td>
                    <td>
                      {p.status === 'delivered' && p.gps_latitude ? (
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-success)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>Doğrulandı</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {p.gps_latitude.toFixed(4)}, {p.gps_longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Yok</span>
                      )}
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Kayıtlı teslimat kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Developer scan simulator - sadece geliştirici modunda */}
        {isDevMode && (
        <div className="glass-card" style={{ border: '1px solid var(--brand-secondary)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck size={18} color="var(--brand-secondary)" /> Kurye Teslimat Simülatörü
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Paket teslim etme adımlarını (GPS ve alıcı WhatsApp OTP onay süreçleri) simüle etmek için aşağıdaki formu kullanabilirsiniz.
          </p>

          <form onSubmit={handleSimulateScan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Adım 1: Zimmetli veya Bekleyen Paket</label>
              <select 
                required
                value={selectedPackId} 
                onChange={e => setSelectedPackId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Paket Seçin...</option>
                {packages.filter(p => p.status !== 'delivered').map(p => (
                  <option key={p.id} value={p.id}>{p.package_code} - {p.recipient_name}</option>
                ))}
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, border: '1px dashed var(--glass-border)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} className="text-muted" />
              <span>
                Simülasyon açıldığında alıcı Reverse OTP doğrulaması ve dijital imza pedini test edebilirsiniz.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!selectedPackId}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.8rem' }}
            >
              <ExternalLink size={16} /> Kurye Teslimat Ekranını Aç
            </button>
          </form>
        </div>
        )}

      </div>

      {/* Command Palette */}
      {showCmd && (
        <div className="cmd-palette-overlay" onClick={(e) => e.target === e.currentTarget && setShowCmd(false)}>
          <div className="cmd-palette">
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', padding: '0 1rem' }}>
               <Search size={20} color="var(--text-muted)" />
               <input autoFocus value={cmdSearch} onChange={e => setCmdSearch(e.target.value)} placeholder="Paket, Kurye veya Alıcı ara..." />
               <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4, color: 'var(--text-muted)' }}>ESC</div>
            </div>
            <div className="cmd-palette-list">
               <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>Hızlı Arama Sonuçları</div>
               {cmdSearch && packages.filter(item => (item.package_code && item.package_code.toLowerCase().includes(cmdSearch.toLowerCase())) || (item.recipient_name && item.recipient_name.toLowerCase().includes(cmdSearch.toLowerCase()))).slice(0, 5).map((item, idx) => (
                 <div key={idx} className="cmd-palette-item" onClick={() => setShowCmd(false)}>
                   <Box size={16} /> {item.recipient_name} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({item.package_code})</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: '#ffffff',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box'
};

/* ---------------- ANALİTİK BÖLÜMÜ ---------------- */

// Marka renk paleti
const BRAND_COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#10b981'];

// Paket durumlarının Türkçe karşılıkları ve renkleri
const STATUS_MAP = {
  created:    { label: 'Oluşturuldu',   color: '#64748b' },
  in_transit: { label: 'Yolda',          color: '#f59e0b' },
  delivered:  { label: 'Teslim Edildi',  color: '#10b981' },
  failed:     { label: 'Başarısız',      color: '#ef4444' },
  returned:   { label: 'İade',           color: '#6366f1' },
  partial:    { label: 'Kısmi',          color: '#0ea5e9' },
};

const translateStatus = (s) => (STATUS_MAP[s]?.label) || s;
const statusColor = (s, i = 0) => (STATUS_MAP[s]?.color) || BRAND_COLORS[i % BRAND_COLORS.length];

// Kısa gün etiketi (YYYY-MM-DD -> GG.AA)
const shortDay = (day) => {
  if (!day || typeof day !== 'string') return day;
  const parts = day.split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : day;
};

function ChartCard({ icon, title, children, empty, emptyText }) {
  return (
    <div className="glass-card" style={{ minWidth: 0 }}>
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {title}
      </h3>
      {empty ? (
        <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <Activity size={28} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: '0.85rem' }}>{emptyText || 'Henüz veri bulunmuyor.'}</span>
        </div>
      ) : children}
    </div>
  );
}

function AnalyticsSection({ analytics }) {
  if (!analytics) return null;

  const daily = Array.isArray(analytics.daily) ? analytics.daily : [];
  const statusDist = Array.isArray(analytics.status_distribution) ? analytics.status_distribution : [];
  const courierPerf = Array.isArray(analytics.courier_performance) ? analytics.courier_performance : [];
  const summary = analytics.summary || {};

  const dailyData = daily.map(d => ({ label: shortDay(d.day), count: Number(d.count) || 0 }));
  const statusData = statusDist.map(s => ({
    name: translateStatus(s.status),
    value: Number(s.count) || 0,
    color: statusColor(s.status),
  }));
  const courierData = courierPerf
    .map(c => ({ name: c.courier, delivered: Number(c.delivered) || 0 }))
    .sort((a, b) => a.delivered - b.delivered); // yatay barda en yüksek üstte görünsün

  const kpis = [
    { icon: <Users size={22} />, label: 'Toplam Kurye', value: summary.couriers ?? 0, color: 'var(--brand-primary)', bg: 'rgba(14, 165, 233, 0.1)' },
    { icon: <Activity size={22} />, label: 'Aktif Kurye', value: summary.active_couriers ?? 0, color: 'var(--brand-secondary)', bg: 'rgba(99, 102, 241, 0.1)' },
    { icon: <Package size={22} />, label: 'Toplam Paket', value: summary.packages ?? 0, color: 'var(--status-success)', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={22} color="var(--brand-primary)" /> Analitik
      </h2>

      {/* KPI kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {kpis.map((k, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{k.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend + Durum dağılımı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <ChartCard
          icon={<TrendingUp size={18} color="var(--brand-primary)" />}
          title="Son 30 Gün Teslimat Trendi"
          empty={dailyData.length === 0}
          emptyText="Son 30 günde teslimat kaydı yok."
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="teslimatTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={32} />
              <Tooltip formatter={(v) => [`${v} teslimat`, 'Teslimat']} labelStyle={{ color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="count" name="Teslimat" stroke="#0ea5e9" strokeWidth={2} fill="url(#teslimatTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          icon={<Package size={18} color="var(--brand-secondary)" />}
          title="Paket Durum Dağılımı"
          empty={statusData.length === 0 || statusData.every(s => s.value === 0)}
          emptyText="Paket durum verisi yok."
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {statusData.map((entry, i) => <Cell key={`s-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Kurye performansı */}
      <ChartCard
        icon={<Truck size={18} color="var(--status-warning)" />}
        title="Kurye Teslim Sayıları"
        empty={courierData.length === 0}
        emptyText="Kurye teslimat verisi yok."
      >
        <ResponsiveContainer width="100%" height={Math.max(240, courierData.length * 38)}>
          <BarChart data={courierData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <Tooltip formatter={(v) => [`${v} teslimat`, 'Teslim']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="delivered" name="Teslim" radius={[0, 6, 6, 0]} barSize={18}>
              {courierData.map((_, i) => <Cell key={`c-${i}`} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
