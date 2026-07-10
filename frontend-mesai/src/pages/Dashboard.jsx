import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  MapPin,
  Search,
  Command,
  Box,
  Users,
  Clock,
  Activity,
  FileText,
  QrCode,
  ExternalLink,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  ArrowRight,
  Rocket,
  UserCheck,
  LogIn,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';

export default function Dashboard({ user }) {
  const isCompany = user?.role === 'company';
  
  // States
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Employee stats states
  const [employeeReport, setEmployeeReport] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showCmd, setShowCmd] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  
  // Simulation states
  const [selectedLocId, setSelectedLocId] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(user?.role === 'employee' ? user.id : '');

  const host = getApiUrl();
  const token = user?.token;

  // Sadece geliştirici modunda (yerelde) görünsün; canlıda (qimlik.com) gizle.
  const isDevMode = typeof window !== 'undefined' && !window.location.hostname.endsWith('qimlik.com');

  const fetchCompanyData = async () => {
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resLoc = await axios.get(`${host}/api/mesai/locations`, { headers });
      setLocations(resLoc.data);
      if (resLoc.data.length > 0) setSelectedLocId(resLoc.data[0].id.toString());
      
      const resEmp = await axios.get(`${host}/api/mesai/employees`, { headers });
      setEmployees(resEmp.data);

      const resLogs = await axios.get(`${host}/api/mesai/company/logs`, { headers });
      setLogs(resLogs.data);

      try {
        const resAnalytics = await axios.get(`${host}/api/mesai/company/analytics`, { headers });
        setAnalytics(resAnalytics.data);
      } catch (analyticsErr) {
        // Analitik verisi kritik değil; sessizce geç, panel çalışmaya devam etsin.
        console.error('Analitik verisi yüklenemedi:', analyticsErr);
      }
    } catch (err) {
      toast.error('Firma verileri yüklenirken hata');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const resReport = await axios.get(`${host}/api/mesai/worker/report`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEmployeeReport(resReport.data);
    } catch (err) {
      toast.error('Personel verileri yüklenirken hata');
    } finally {
      setLoadingData(false);
    }
  };

  // Wait, let's also fetch locations for employee simulator so they can simulate easily.
  // We can write a public list route or since it is local testing, we can let them enter ID or we will make an open endpoint for listing locations.
  // Actually, let's look at what we need. For simplicity, we can fetch locations if we make a simple endpoint, or just allow the employee to enter the location name/ID, or we can fetch them.
  // Wait, let's look at `fetchEmployeeLocations`
  const fetchEmployeeLocations = async () => {
    try {
      // In this setup, we can fetch locations by calling `/api/mesai/company/logs` or since employee doesn't have companyAuth, let's retrieve them or let them choose.
      // Actually, since we want employee simulation to be super smooth, let's create a public locations listing or just list locations.
      // Let's check if we can make a public route `GET /api/mesai/public/locations` in `backend/routes/mesai.js` to list locations. That's very helpful!
      const res = await axios.get(`${host}/api/mesai/worker/locations`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLocations(res.data);
      if (res.data.length > 0) setSelectedLocId(res.data[0].id.toString());
    } catch (err) {
      console.error('Lokasyonlar yüklenemedi:', err);
    }
  };

  useEffect(() => {
    if (isCompany) {
      fetchCompanyData();
    } else {
      fetchEmployeeData();
      fetchEmployeeLocations();
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
    if (!selectedLocId) return;
    
    // Open check page in a new window / tab
    window.open(`/check/${selectedLocId}`, '_blank');
  };

  // Count active check-ins today (unique employees currently clocked in)
  const getTodayActiveCount = () => {
    const todayStr = new Date().toLocaleDateString('tr-TR');
    const activeStaff = new Set();
    
    // Sort logs chronologically to check final state
    const sortedLogs = [...logs].reverse();
    const staffState = {}; // employee_id -> check_in or check_out
    
    sortedLogs.forEach(log => {
      const logDate = new Date(log.created_at).toLocaleDateString('tr-TR');
      if (logDate === todayStr) {
        staffState[log.employee_id] = log.log_type;
      }
    });

    Object.entries(staffState).forEach(([empId, type]) => {
      if (type === 'check_in') {
        activeStaff.add(empId);
      }
    });

    return activeStaff.size;
  };

  if (!isCompany) {
    /* --- SAHA PERSONELİ (EMPLOYEE) DASHBOARD --- */
    const monthlySummary = employeeReport?.monthly[0] || { hours: 0, days_present: 0 };
    const latestLogs = employeeReport?.daily.slice(0, 5) || [];

    return (
      <div style={{ maxWidth: '900px' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="gradient-text">Hoş Geldiniz, {user.name}!</h1>
          <p className="text-muted">Mesai saatlerinizi ve günlük giriş/çıkış kayıtlarınızı bu panelden takip edebilirsiniz.</p>
        </header>

        {/* Retrospective Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bu Ayki Toplam Mesai</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{monthlySummary.hours} Saat</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Çalışılan Gün Sayısı</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{monthlySummary.days_present} Gün</div>
            </div>
          </div>
        </div>

        {/* QR SCAN SIMULATION (For testing on laptop browser) - sadece geliştirici modunda */}
        {isDevMode && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid var(--brand-secondary)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <QrCode size={30} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Şantiye QR Kod Tarama Simülatörü</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Sahadaki QR kodunu kameranızla okutmuş gibi simüle etmek için aşağıdaki çalışma alanlarından birini seçip butona basın.
          </p>

          <form onSubmit={handleSimulateScan} style={{ display: 'flex', gap: '0.75rem', maxWidth: '450px', margin: '0 auto', flexWrap: 'wrap' }}>
            <select
              value={selectedLocId}
              onChange={e => setSelectedLocId(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="">Çalışma Alanı Seçin...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.location_name}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary" disabled={!selectedLocId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={16} /> QR Giriş Sayfasını Aç
            </button>
          </form>
        </div>
        )}

        {/* Recent logs check list */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <FileText size={18} color="var(--brand-primary)" /> Son Giriş / Çıkış Geçmişiniz
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Giriş Saati</th>
                  <th>Çıkış Saati</th>
                  <th>Süre (Saat)</th>
                  <th>Çalışma Alanı</th>
                </tr>
              </thead>
              <tbody>
                {latestLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.date}</td>
                    <td style={{ color: 'var(--status-success)', fontWeight: 600 }}>{log.check_in}</td>
                    <td style={{ color: 'var(--status-warning)', fontWeight: 600 }}>{log.check_out}</td>
                    <td>{log.hours}</td>
                    <td>{log.location}</td>
                  </tr>
                ))}
                {latestLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Henüz mesai giriş/çıkış kaydınız bulunmuyor.
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

  /* --- FİRMA YETKİLİSİ (COMPANY) DASHBOARD --- */
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">{user.company_name} Yönetim Paneli</h1>
        <p className="text-muted">Şantiyelerinizdeki son hareketleri, çalışan durumlarını ve verimliliği izleyin.</p>
      </header>

      {/* İlk kullanım rehberi: hiç lokasyon ve hiç personel yoksa göster */}
      {!loadingData && locations.length === 0 && employees.length === 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rocket size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Başlarken</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Mesai takibini başlatmak için üç kısa adım.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {/* Adım 1 */}
            <Link to="/locations" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</span>
                  <MapPin size={18} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Çalışma alanı ekleyin</div>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem', flex: 1 }}>Şantiye veya ofisinizin konumunu ve giriş toleransını tanımlayın.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Lokasyon ekle <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            {/* Adım 2 */}
            <Link to="/employees" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</span>
                  <Users size={18} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Personel ekleyin</div>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem', flex: 1 }}>Saha personellerinizi telefon numaralarıyla birlikte kaydedin.</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Personel ekle <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            {/* Adım 3 */}
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</span>
                <Smartphone size={18} />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Mesai başlasın</div>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem', flex: 1 }}>Personel telefonundan şantiyedeki QR kodu okutarak giriş yapıp mesaisini başlatır.</p>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Kayıtlar otomatik oluşur.</span>
            </div>
          </div>
        </div>
      )}

      {/* ANALİTİK BÖLÜMÜ */}
      {analytics && (
        <div style={{ marginBottom: '2rem' }}>
          {/* KPI kart satırı */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {[
              { icon: Users, label: 'Toplam Personel', value: analytics.summary?.employees ?? 0, bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', highlight: false },
              { icon: UserCheck, label: 'Aktif Personel', value: analytics.summary?.active_employees ?? 0, bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', highlight: false },
              { icon: MapPin, label: 'Çalışma Alanı', value: analytics.summary?.locations ?? 0, bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', highlight: false },
              { icon: LogIn, label: 'Bu Ay Giriş', value: analytics.summary?.month_checkins ?? 0, bg: 'var(--brand-gradient)', color: '#fff', highlight: true },
              { icon: ShieldAlert, label: 'Bu Ay Sınır Dışı', value: analytics.summary?.month_out_of_bounds ?? 0, bg: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', highlight: true },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  ...(kpi.highlight ? { background: kpi.bg, border: 'none' } : {})
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: kpi.highlight ? 'rgba(255,255,255,0.2)' : kpi.bg,
                  color: kpi.highlight ? '#fff' : kpi.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <kpi.icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: kpi.highlight ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: kpi.highlight ? '#fff' : 'var(--text-primary)' }}>{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend grafiği */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={18} color="#6366f1" /> Son 30 Gün Mesai Girişleri
            </h3>
            {analytics.daily && analytics.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mesaiTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return isNaN(dt) ? d : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                    }}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    labelFormatter={(d) => {
                      const dt = new Date(d);
                      return isNaN(dt) ? d : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
                    }}
                    formatter={(value) => [`${value} giriş`, 'Mesai']}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#mesaiTrend)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#0ea5e9' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }} className="text-muted">
                <TrendingUp size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Henüz veri yok</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Toplam Şantiye / Sınır</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{locations.length} Lokasyon</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kayıtlı Saha Personeli</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{employees.length} Kişi</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bugün Sahada Çalışan</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{getTodayActiveCount()} Personel</div>
          </div>
        </div>
        
        {employees.length > 0 && !loadingData && (
          <div className="glass-card" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={[
                     { name: 'Sahada', value: getTodayActiveCount(), color: '#f59e0b' },
                     { name: 'Değil', value: employees.length - getTodayActiveCount(), color: '#94a3b8' }
                   ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40}>
                   {
                     [
                       { name: 'Sahada', value: getTodayActiveCount(), color: '#f59e0b' },
                       { name: 'Değil', value: employees.length - getTodayActiveCount(), color: '#94a3b8' }
                     ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                   }
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDevMode ? '1.2fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Recent Activity Logs */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={18} color="var(--brand-primary)" /> Son Giriş/Çıkış Hareketleri (Canlı)
          </h3>
          
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>İşlem</th>
                  <th>Saat</th>
                  <th>Konum</th>
                  <th>Sapma</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map(log => {
                  const dateVal = new Date(log.created_at);
                  const timeStr = dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  const isSuccess = log.calculated_distance <= 100; // arbitrary warning threshold

                  return (
                    <tr key={log.id}>
                      <td>
                        <strong>{log.employee_name}</strong>
                      </td>
                      <td>
                        <span className={`badge ${log.log_type === 'check_in' ? 'success' : 'warning'}`}>
                          {log.log_type === 'check_in' ? 'Giriş Yapıldı' : 'Çıkış Yapıldı'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{timeStr}</td>
                      <td>{log.location_name}</td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600, color: isSuccess ? 'var(--status-success)' : '#ef4444' }}>
                        {Math.round(log.calculated_distance)}m
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Henüz mesai logu bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Quick Simulation Panel - sadece geliştirici modunda */}
        {isDevMode && (
        <div className="glass-card" style={{ border: '1px solid var(--brand-secondary)' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <QrCode size={18} color="var(--brand-secondary)" /> Geliştirici & Test Simülatörü
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            QR okutma ve GPS doğrulamalı giriş/çıkış senaryolarını test etmek için aşağıdaki formu kullanabilirsiniz.
          </p>

          <form onSubmit={handleSimulateScan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Adım 1: Test Edilecek Şantiye</label>
              <select 
                required
                value={selectedLocId} 
                onChange={e => setSelectedLocId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Şantiye / Sınır Seçin...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.location_name} (R: {loc.allowed_radius}m)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Adım 2: İşlem Yapacak Personel</label>
              <select 
                required
                value={selectedEmpId} 
                onChange={e => setSelectedEmpId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Personel Seçin...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} {emp.surname}</option>
                ))}
              </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, border: '1px dashed var(--glass-border)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} className="text-muted" />
              <span>
                Simülasyon sayfasını açtıktan sonra Chrome DevTools Sensors panelinden şantiye koordinatlarını simüle ederek mesaiyi test edebilirsiniz.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!selectedLocId || !selectedEmpId}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.8rem' }}
            >
              <ExternalLink size={16} /> QR Test Arayüzünü Aç
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
               <input autoFocus value={cmdSearch} onChange={e => setCmdSearch(e.target.value)} placeholder="Personel veya lokasyon ara..." />
               <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4, color: 'var(--text-muted)' }}>ESC</div>
            </div>
            <div className="cmd-palette-list">
               <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>Hızlı Arama Sonuçları</div>
               {cmdSearch && [...employees.map(e=>({...e, type:'Personel'})), ...locations.map(l=>({...l, type:'Şantiye'}))].filter(item => (item.name && item.name.toLowerCase().includes(cmdSearch.toLowerCase())) || (item.location_name && item.location_name.toLowerCase().includes(cmdSearch.toLowerCase()))).slice(0, 5).map((item, idx) => (
                 <div key={idx} className="cmd-palette-item" onClick={() => setShowCmd(false)}>
                   <Box size={16} /> {item.name ? `${item.name} ${item.surname}` : item.location_name} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({item.type})</span>
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
