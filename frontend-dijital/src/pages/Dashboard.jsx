import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, QrCode, Search, Wrench, AlertCircle, CheckCircle, ExternalLink, Calendar, MapPin, Box, Command, Download, Package, ClipboardList, Users, ArrowRight, TrendingUp, Bell, Cpu, PieChart as PieIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

export default function Dashboard({ user }) {
  const isCompany = user?.role === 'company';
  const navigate = useNavigate();
  
  const [machines, setMachines] = useState([]);
  const [forms, setForms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('machines');
  const [incidents, setIncidents] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartStock, setNewPartStock] = useState('');
  const [stockInputs, setStockInputs] = useState({});
  const [analytics, setAnalytics] = useState(null);


  // New Machine form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [location, setLocation] = useState('');
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [requireLoc, setRequireLoc] = useState(false);
  const [radius, setRadius] = useState(50);
  const [formId, setFormId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Command Palette
  const [showCmd, setShowCmd] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');

  // Technician states
  const [scanCode, setScanCode] = useState('');
  const [techLogs, setTechLogs] = useState([]);

  const host = getApiUrl();
  const token = user?.token;

  // Sadece geliştirici modunda (yerelde) görünsün; canlıda (qimlik.com) gizle.
  const isDevMode = typeof window !== 'undefined' && !window.location.hostname.endsWith('qimlik.com');

  const fetchCompanyData = async () => {
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resM = await axios.get(`${host}/api/dijital/machines`, { headers });
      setMachines(resM.data);
      const resF = await axios.get(`${host}/api/dijital/forms`, { headers });
      setForms(resF.data);
      try {
        const resI = await axios.get(`${host}/api/dijital/company/incidents`, { headers });
        setIncidents(resI.data);
        const resSP = await axios.get(`${host}/api/dijital/spare-parts`, { headers });
        setSpareParts(resSP.data);
      } catch(e) {}
      try {
        const resA = await axios.get(`${host}/api/dijital/company/analytics`, { headers });
        setAnalytics(resA.data);
      } catch(e) {}
    } catch (err) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTechData = async () => {
    try {
      const res = await axios.get(`${host}/api/dijital/technician/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTechLogs(res.data);
    } catch (err) {
      console.error('Son işlemler yüklenemedi:', err);
    }
  };

  useEffect(() => {
    if (isCompany) {
      fetchCompanyData();
    } else {
      fetchTechData();
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

  
  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapor");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${host}/api/dijital/machines`,
        {
          machine_code: code,
          machine_name: name,
          model,
          serial_number: serial,
          location,
          form_template_id: formId,
          gps_latitude: gpsLat ? parseFloat(gpsLat) : null,
          gps_longitude: gpsLng ? parseFloat(gpsLng) : null,
          require_location_match: requireLoc,
          allowed_radius: parseInt(radius),
          maintenance_interval_days: parseInt(document.getElementById('maintInterval').value) || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setCode('');
      setName('');
      setModel('');
      setSerial('');
      setLocation('');
      setGpsLat('');
      setGpsLng('');
      setRequireLoc(false);
      setRadius(50);
      setFormId('');
      fetchCompanyData();
      toast.success('Makine başarıyla eklendi!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Makine eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (partId) => {
    const raw = stockInputs[partId];
    const qty = parseInt(raw);
    if (!raw || isNaN(qty) || qty <= 0) {
      toast.error('Geçerli bir miktar girin.');
      return;
    }
    try {
      await axios.put(`${host}/api/dijital/spare-parts/${partId}/add-stock`, { quantity: qty }, { headers: { Authorization: `Bearer ${token}` } });
      setStockInputs(prev => ({ ...prev, [partId]: '' }));
      fetchCompanyData();
      toast.success('Stok güncellendi.');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  // Technician QR Scan Simulation handler
  const handleScanSimulate = (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    // Redirect to public machine details /m/CODE
    window.open(`/m/${scanCode.trim().toUpperCase()}`, '_blank');
  };

  // Filtered machines for company search
  const filteredMachines = machines.filter(m => 
    m.machine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.machine_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isCompany) {
    /* --- TECHNICIAN VIEW --- */
    return (
      <div style={{ maxWidth: '800px' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="gradient-text">Hoş Geldiniz, Teknisyen Paneli</h1>
          <p className="text-muted">Makine üzerindeki QR kodu kameranızla okutun veya kodu elle girerek servis formunu açın.</p>
        </header>

        {/* QR Scan Simulation Card - sadece geliştirici modunda */}
        {isDevMode && (
        <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <QrCode size={36} />
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>QR Kod Barkod Tarama Simülatörü</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: 450, margin: '0 auto 1.5rem auto' }}>
            Gerçek bir cihazda QR kodunu okuttuğunuzda bu sayfaya yönlendirilirsiniz. Simüle etmek için makine kodunu (örn: <code>MAC-001</code>) yazın.
          </p>

          <form onSubmit={handleScanSimulate} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
            <input 
              required
              placeholder="Makine Kodu Girin (Örn: MAC-001)" 
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={18} /> Ekranı Aç
            </button>
          </form>
        </div>
        )}

        {/* Recent actions list */}
        {techLogs.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--brand-primary)" /> Son Servis Verdiğiniz Cihazlar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {techLogs.slice(0, 5).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace', marginRight: '0.5rem' }}>{log.machine_code}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.machine_name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${log.status_after === 'active' ? 'success' : log.status_after === 'maintenance' ? 'warning' : 'error'}`}>
                      {log.status_after === 'active' ? 'Aktif' : log.status_after === 'maintenance' ? 'Bakımda' : 'Arızalı'}
                    </span>
                    <a href={`/m/${log.machine_code}`} target="_blank" rel="noreferrer" className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      Raporu Aç <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Static list of instructions/help */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Teknisyen Yardım Kılavuzu</h3>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Makine üzerindeki QR etiketi telefon kamerasından okutarak doğrudan forma erişebilirsiniz.</li>
            <li>Bakım işlemini yaparken kanıt fotoğrafı yükleyebilirsiniz (fotoğraflar otomatik olarak sıkıştırılır).</li>
            <li>Çevrimdışı işlem yapılamaz, WhatsApp doğrulama oturumunuzun aktif olması gerekmektedir.</li>
          </ul>
        </div>
      </div>
    );
  }

  /* --- COMPANY VIEW --- */
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Makine & Servis Yönetimi</h1>
          <p className="text-muted">Envanterinizi, arıza taleplerini ve yedek parça stoklarınızı yönetin.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => exportToExcel(
              activeTab === 'machines' ? machines : activeTab === 'incidents' ? incidents : spareParts, 
              `Qimlik_Rapor_${activeTab}`
            )} 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} /> Excel İndir
          </button>
          {activeTab === 'machines' && (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} /> Yeni Makine Ekle
            </button>
          )}
        </div>
      </header>

      {/* ANALİTİK BÖLÜMÜ */}
      {analytics && <AnalyticsSection data={analytics} loading={loadingData} />}

      {/* İlk kullanım rehberi: hiç makine yokken göster, veri girildikçe kaybolur */}
      {!loadingData && machines.length === 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem', background: 'var(--brand-gradient-soft, rgba(2,132,199,0.04))', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Başlarken</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Sistemi kurmak için 3 basit adım. Kurulum tamamlandıkça bu kart otomatik kaybolacak.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { step: 1, done: forms.length > 0, icon: ClipboardList, title: 'Kontrol formu oluşturun', desc: 'Teknisyenin sahada dolduracağı bakım şablonunu tasarlayın.', onClick: () => navigate('/forms') },
              { step: 2, done: false, icon: Box, title: 'Makine ekleyip forma bağlayın', desc: 'Ekipmanınızı kaydedin, QR kodunu alın ve bir forma bağlayın.', onClick: () => { setActiveTab('machines'); setShowAddModal(true); } },
              { step: 3, done: false, icon: Users, title: 'Teknisyen ekleyin', desc: 'Sahadaki personeli ekleyin; QR okutup bakım yapsınlar.', onClick: () => navigate('/technicians') },
            ].map(s => {
              const StepIcon = s.icon;
              return (
                <button
                  key={s.step}
                  onClick={s.onClick}
                  className="glass-card"
                  style={{ textAlign: 'left', cursor: 'pointer', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid var(--glass-border)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.done ? 'rgba(16,185,129,0.12)' : 'rgba(2,132,199,0.1)', color: s.done ? '#10b981' : 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.done ? <CheckCircle size={22} /> : <StepIcon size={22} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ADIM {s.step}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{s.desc}</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto' }}>
                    {s.done ? 'Tamamlandı' : 'Başla'} <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('machines')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', color: activeTab === 'machines' ? 'var(--brand-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'machines' ? '2px solid var(--brand-primary)' : '2px solid transparent', fontWeight: activeTab === 'machines' ? 600 : 400 }}
        >
          Makineler
        </button>
        <button 
          onClick={() => setActiveTab('incidents')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', color: activeTab === 'incidents' ? 'var(--brand-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'incidents' ? '2px solid var(--brand-primary)' : '2px solid transparent', fontWeight: activeTab === 'incidents' ? 600 : 400 }}
        >
          Müşteri Arıza Talepleri
          {incidents.filter(i => i.status === 'pending').length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 10, fontSize: '0.7rem', marginLeft: '0.5rem' }}>{incidents.filter(i => i.status === 'pending').length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('spareParts')}
          style={{ background: 'transparent', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', color: activeTab === 'spareParts' ? 'var(--brand-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'spareParts' ? '2px solid var(--brand-primary)' : '2px solid transparent', fontWeight: activeTab === 'spareParts' ? 600 : 400 }}
        >
          Yedek Parça & Stok
        </button>
      </div>


      {activeTab === 'machines' && (
        <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Makine adı, kodu veya konuma göre ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, outline: 'none' }}
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      {machines.length > 0 && !loadingData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <CheckCircle size={24} />
             </div>
             <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{machines.filter(m => m.status === 'active').length}</div>
               <div className="text-muted" style={{ fontSize: '0.85rem' }}>Aktif Cihazlar</div>
             </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <AlertCircle size={24} />
             </div>
             <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{machines.filter(m => m.status === 'error').length}</div>
               <div className="text-muted" style={{ fontSize: '0.85rem' }}>Arızalı Cihazlar</div>
             </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={[
                     { name: 'Aktif', value: machines.filter(m => m.status === 'active').length, color: '#10b981' },
                     { name: 'Arızalı', value: machines.filter(m => m.status === 'error').length, color: '#ef4444' },
                     { name: 'Bakımda', value: machines.filter(m => m.status === 'maintenance').length, color: '#f59e0b' }
                   ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40}>
                   {
                     [
                       { name: 'Aktif', value: machines.filter(m => m.status === 'active').length, color: '#10b981' },
                       { name: 'Arızalı', value: machines.filter(m => m.status === 'error').length, color: '#ef4444' },
                       { name: 'Bakımda', value: machines.filter(m => m.status === 'maintenance').length, color: '#f59e0b' }
                     ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                   }
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid of machines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loadingData ? (
          // Skeleton Loaders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ height: 280, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton-box" style={{ height: 24, width: '40%' }}></div>
              <div className="skeleton-box" style={{ height: 20, width: '80%' }}></div>
              <div className="skeleton-box" style={{ height: 16, width: '60%' }}></div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                <div className="skeleton-box" style={{ height: 64, width: 64 }}></div>
                <div className="skeleton-box" style={{ height: 64, flex: 1 }}></div>
              </div>
            </div>
          ))
        ) : filteredMachines.map(m => {
          const qrLink = `${window.location.protocol}//${window.location.host}/m/${m.machine_code}`;
          const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrLink)}`;

          return (
            <div key={m.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', marginRight: '0.5rem', fontFamily: 'monospace' }}>{m.machine_code}</span>
                    <span className={`badge ${m.status === 'active' ? 'success pulse-badge' : m.status === 'maintenance' ? 'warning pulse-badge' : 'error'}`}>
                      {m.status === 'active' ? 'Aktif' : m.status === 'maintenance' ? 'Bakımda' : 'Arızalı'}
                    </span>
                  </div>
                  <a href={`/m/${m.machine_code}`} target="_blank" rel="noreferrer" title="Detay Ekranını Aç" style={{ color: 'var(--brand-primary)', padding: '0.25rem', borderRadius: 4, background: 'rgba(2,132,199,0.1)' }}>
                    <ExternalLink size={18} />
                  </a>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{m.machine_name}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <MapPin size={14} className="text-muted" />
                    <span>Konum: {m.location || '-'}</span>
                  </div>
                  <div>Model / Seri No: {m.model || '-'} / {m.serial_number || '-'}</div>
                  {m.require_location_match === 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontWeight: 600 }}>
                       <MapPin size={12} /> GPS Doğrulaması Açık (Yarıçap: {m.allowed_radius}m)
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem', color: 'var(--brand-secondary)' }}>
                    Atanan Form: <strong>{m.form_title || 'Yok'}</strong>
                  </div>
                  {m.maintenance_interval_days && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      Periyodik Bakım: <strong>{m.maintenance_interval_days} Gün</strong>
                      {(() => {
                        if (!m.last_maintenance_date) return <div style={{color: '#f59e0b'}}>Hiç bakım yapılmadı.</div>;
                        const diff = Math.floor((new Date() - new Date(m.last_maintenance_date)) / (1000 * 60 * 60 * 24));
                        const isOverdue = diff >= m.maintenance_interval_days;
                        return (
                          <div style={{ color: isOverdue ? '#ef4444' : '#10b981', fontWeight: isOverdue ? 600 : 400 }}>
                            Son Bakım: {diff} gün önce {isOverdue && '(BAKIM GECİKTİ!)'}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* QR Image Download Area */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: 8, padding: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                <img src={qrImage} alt="Machine QR" style={{ width: 64, height: 64, display: 'block', borderRadius: 4, background: 'white', padding: 2 }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Etiket QR Kodu</div>
                  <a href={qrImage} download={`${m.machine_code}_qr.png`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', textDecoration: 'none', display: 'block', marginTop: 4 }}>
                    Görseli İndir
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {machines.length > 0 && filteredMachines.length === 0 && !loadingData && (
          <EmptyState
            fullSpan
            icon={Search}
            title="Sonuç bulunamadı"
            description={`"${searchQuery}" aramanıza uyan bir makine yok. Farklı bir ad, kod veya konum deneyin.`}
          />
        )}
      </div>
      </>
      )}

      {/* INCIDENTS TAB */}
      {activeTab === 'incidents' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Müşteri Arıza Bildirimleri</h2>
          {incidents.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Henüz arıza talebi yok"
              description="Müşteriler makine üzerindeki QR kodu okutup arıza bildirdiğinde talepler burada listelenecek ve buradan yönetebileceksiniz."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0' }}>Tarih</th>
                  <th style={{ padding: '0.75rem 0' }}>Makine</th>
                  <th style={{ padding: '0.75rem 0' }}>Müşteri Adı</th>
                  <th style={{ padding: '0.75rem 0' }}>Telefon</th>
                  <th style={{ padding: '0.75rem 0' }}>Açıklama</th>
                  <th style={{ padding: '0.75rem 0' }}>Durum</th>
                  <th style={{ padding: '0.75rem 0' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '0.75rem 0' }}>{new Date(i.created_at).toLocaleDateString('tr-TR')}</td>
                    <td style={{ padding: '0.75rem 0' }}>{i.machine_name} <br/><span className="text-muted" style={{fontSize: '0.75rem'}}>{i.machine_code}</span></td>
                    <td style={{ padding: '0.75rem 0' }}>{i.reporter_name}</td>
                    <td style={{ padding: '0.75rem 0' }}>{i.reporter_phone}</td>
                    <td style={{ padding: '0.75rem 0', maxWidth: 200 }}>{i.description}</td>
                    <td style={{ padding: '0.75rem 0' }}>
                      <span className={`badge ${i.status === 'resolved' ? 'success' : 'warning'}`}>
                        {i.status === 'resolved' ? 'Çözüldü' : 'Bekliyor'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0' }}>
                      {i.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            try {
                              await axios.put(`${host}/api/dijital/company/incidents/${i.id}/resolve`, {}, { headers: { Authorization: `Bearer ${token}` } });
                              fetchCompanyData();
                              toast.success('Çözüldü olarak işaretlendi.');
                            } catch (e) { toast.error('Hata oluştu'); }
                          }}
                          className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Çözüldü İşaretle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SPARE PARTS TAB */}
      {activeTab === 'spareParts' && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '1.5rem', flex: '1 1 300px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Yeni Yedek Parça Tanımla</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axios.post(`${host}/api/dijital/spare-parts`, { part_name: newPartName, stock_quantity: parseInt(newPartStock)||0 }, { headers: { Authorization: `Bearer ${token}` } });
                setNewPartName(''); setNewPartStock('');
                fetchCompanyData();
                toast.success('Parça stoklara eklendi');
              } catch(e) { toast.error('Hata oluştu'); }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Parça Adı</label>
                <input required style={inputStyle} value={newPartName} onChange={e => setNewPartName(e.target.value)} placeholder="Örn: 500W Güç Kaynağı" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Başlangıç Stoğu</label>
                <input type="number" required style={inputStyle} value={newPartStock} onChange={e => setNewPartStock(e.target.value)} placeholder="Adet" />
              </div>
              <button type="submit" className="btn-primary">Stoğa Ekle</button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', flex: '2 1 500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Stok Durumu</h2>
            {spareParts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Henüz yedek parça yok"
                description="Soldaki formu kullanarak ilk yedek parçanızı stoğa ekleyin. Eklediğiniz parçaların stok durumunu buradan takip edebilirsiniz."
              />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0' }}>Parça Adı</th>
                    <th style={{ padding: '0.75rem 0' }}>Mevcut Stok</th>
                    <th style={{ padding: '0.75rem 0' }}>Stok Ekle</th>
                  </tr>
                </thead>
                <tbody>
                  {spareParts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{p.part_name}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span className={`badge ${p.stock_quantity > 5 ? 'success' : p.stock_quantity > 0 ? 'warning' : 'error'}`}>{p.stock_quantity} Adet</span>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="Adet"
                            value={stockInputs[p.id] || ''}
                            onChange={e => setStockInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddStock(p.id); }}
                            style={{ width: 70, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }}
                          />
                          <button onClick={() => handleAddStock(p.id)} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>+ Ekle</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Command Palette */}
      {showCmd && (
        <div className="cmd-palette-overlay" onClick={(e) => e.target === e.currentTarget && setShowCmd(false)}>
          <div className="cmd-palette">
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', padding: '0 1rem' }}>
               <Search size={20} color="var(--text-muted)" />
               <input autoFocus value={cmdSearch} onChange={e => setCmdSearch(e.target.value)} placeholder="Bir makine ara veya komut girin..." />
               <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4, color: 'var(--text-muted)' }}>ESC</div>
            </div>
            <div className="cmd-palette-list">
               <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>Hızlı İşlemler</div>
               <div className="cmd-palette-item" onClick={() => { setShowCmd(false); setShowAddModal(true); }}>
                 <Plus size={16} /> Yeni Makine Ekle
               </div>
               
               {cmdSearch && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '1rem 1rem 0.5rem 1rem', borderTop: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>Arama Sonuçları</div>}
               {machines.filter(m => m.machine_name.toLowerCase().includes(cmdSearch.toLowerCase()) || m.machine_code.toLowerCase().includes(cmdSearch.toLowerCase())).slice(0, 5).map(m => (
                 <div key={m.id} className="cmd-palette-item" onClick={() => { setShowCmd(false); window.open(`/m/${m.machine_code}`, '_blank'); }}>
                   <Box size={16} /> {m.machine_name} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({m.machine_code})</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 450, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Envanter Ekle</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddMachine} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Ekipman Kodu (Benzersiz)</label>
                <input required style={inputStyle} value={code} onChange={e => setCode(e.target.value)} placeholder="Örn: MAC-001" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Ekipman Adı</label>
                <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Aksa Jeneratör 500kW" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Model</label>
                  <input style={inputStyle} value={model} onChange={e => setModel(e.target.value)} placeholder="Model" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Seri No</label>
                  <input style={inputStyle} value={serial} onChange={e => setSerial(e.target.value)} placeholder="Seri Numarası" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Periyodik Bakım Süresi (Gün - Opsiyonel)</label>
                <input type="number" id="maintInterval" style={inputStyle} placeholder="Örn: 180" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Bulunduğu Konum</label>
                <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Örn: B Blok Kat -2 Jeneratör Odası" />
              </div>
              
              <div style={{ background: 'rgba(15,23,42,0.02)', padding: '1rem', borderRadius: 8, border: '1px dashed var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>Konum Doğrulaması (Opsiyonel)</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input type="checkbox" checked={requireLoc} onChange={e => setRequireLoc(e.target.checked)} id="requireLocCheck" style={{ width: 16, height: 16 }} />
                    <label htmlFor="requireLocCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Bakım formunda teknisyenin GPS konumunu doğrula</label>
                </div>
                
                {requireLoc && (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Enlem (Lat)</label>
                        <input type="number" step="any" style={{...inputStyle, padding: '0.5rem'}} value={gpsLat} onChange={e => setGpsLat(e.target.value)} placeholder="Örn: 41.0082" required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Boylam (Lng)</label>
                        <input type="number" step="any" style={{...inputStyle, padding: '0.5rem'}} value={gpsLng} onChange={e => setGpsLng(e.target.value)} placeholder="Örn: 28.9784" required />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Maks. Sapma Yarıçapı (Metre)</label>
                        <input type="number" style={{...inputStyle, padding: '0.5rem'}} value={radius} onChange={e => setRadius(e.target.value)} required />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              pos => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); toast.success('Konum alındı.'); },
                              err => toast.error('Konum alınamadı: ' + err.message)
                            );
                          }
                        }}
                        className="btn-outline" 
                        style={{ padding: '0.5rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        📍 Şu Anki Konumumu Al
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Atanacak Kontrol Şablonu</label>
                <select required style={selectStyle} value={formId} onChange={e => setFormId(e.target.value)}>
                  <option value="">Şablon Seçin...</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Ekleniyor...' : 'Ekle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TR = { active: 'Aktif', maintenance: 'Bakımda', error: 'Arızalı', inactive: 'Pasif', passive: 'Pasif', broken: 'Arızalı' };
const STATUS_COLOR = { active: '#10b981', maintenance: '#f59e0b', error: '#ef4444', broken: '#ef4444', inactive: '#94a3b8', passive: '#94a3b8' };

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return '-';
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
};

function AnalyticsSection({ data, loading }) {
  const summary = data.summary || {};
  const daily = Array.isArray(data.daily) ? data.daily : [];
  const machineStatus = Array.isArray(data.machine_status) ? data.machine_status : [];
  const upcoming = Array.isArray(data.upcoming_maintenance) ? data.upcoming_maintenance : [];

  // Trend verisini tarihe göre normalize et (gün etiketi kısalt)
  const trendData = daily.map(d => ({
    day: d.day,
    label: (() => { const dt = new Date(d.day); return isNaN(dt) ? d.day : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }); })(),
    count: Number(d.count) || 0,
  }));

  const pieData = machineStatus
    .map(s => ({ name: STATUS_TR[s.status] || s.status || 'Diğer', value: Number(s.count) || 0, color: STATUS_COLOR[s.status] || '#6366f1' }))
    .filter(s => s.value > 0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (nextDue) => { const dt = new Date(nextDue); return !isNaN(dt) && dt < today; };

  const kpis = [
    { label: 'Toplam Makine', value: summary.machines ?? 0, icon: Cpu, color: 'var(--brand-primary)', bg: 'rgba(14,165,233,0.1)', alert: false },
    { label: 'Teknisyen', value: summary.technicians ?? 0, icon: Users, color: 'var(--brand-secondary)', bg: 'rgba(99,102,241,0.1)', alert: false },
    { label: 'Açık Arıza', value: summary.open_incidents ?? 0, icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', alert: (summary.open_incidents ?? 0) > 0 },
    { label: 'Kritik Stok', value: summary.low_stock_parts ?? 0, icon: Package, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', alert: (summary.low_stock_parts ?? 0) > 0 },
  ];

  if (loading) {
    return (
      <div style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card" style={{ height: 96 }}>
            <div className="skeleton-box" style={{ height: 20, width: '50%', marginBottom: '0.75rem' }}></div>
            <div className="skeleton-box" style={{ height: 28, width: '30%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
        <TrendingUp size={20} color="var(--brand-primary)" /> Analitik Genel Bakış
      </h2>

      {/* KPI Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {kpis.map(k => {
          const KIcon = k.icon;
          return (
            <div key={k.label} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: k.alert ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--glass-border)', background: k.alert ? 'rgba(239,68,68,0.04)' : undefined }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KIcon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: k.alert ? '#ef4444' : 'var(--text-primary)', lineHeight: 1 }}>{k.value}</div>
                <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ÖNLEYİCİ BAKIM UYARI KARTI */}
      {upcoming.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(245,158,11,0.45)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Yaklaşan &amp; Geciken Bakımlar</h3>
              <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>Önümüzdeki 7 gün içinde bakımı gereken veya süresi geçmiş {upcoming.length} makine</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {upcoming.map((m, idx) => {
              const overdue = isOverdue(m.next_due);
              return (
                <div key={m.machine_code || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.6)', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${overdue ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.3)'}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{m.machine_code}</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{m.machine_name}</strong>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      Son bakım: {fmtDate(m.last_maintenance_date)}
                      {m.maintenance_interval_days ? ` • Periyot: ${m.maintenance_interval_days} gün` : ''}
                      {' • Sonraki: '}<strong style={{ color: overdue ? '#ef4444' : '#b45309' }}>{fmtDate(m.next_due)}</strong>
                    </div>
                  </div>
                  <span className="badge" style={{ background: overdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.18)', color: overdue ? '#ef4444' : '#b45309', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {overdue ? 'GECİKTİ' : 'Yaklaşıyor'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grafikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Trend grafiği */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <TrendingUp size={18} color="var(--brand-primary)" /> Son 30 Gün Bakım Kayıtları
          </h3>
          {trendData.length === 0 || trendData.every(d => d.count === 0) ? (
            <EmptyState icon={TrendingUp} title="Henüz bakım kaydı yok" description="Teknisyenler bakım yaptıkça günlük bakım hareketleri burada grafiklenecek." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval="preserveStartEnd" minTickGap={24} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }} labelStyle={{ color: 'var(--text-primary)' }} formatter={(v) => [`${v} bakım`, 'Kayıt']} />
                <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorMaint)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Makine durum dağılımı */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <PieIcon size={18} color="var(--brand-secondary)" /> Makine Durum Dağılımı
          </h3>
          {pieData.length === 0 ? (
            <EmptyState icon={PieIcon} title="Makine bulunmuyor" description="Makine ekledikçe durum dağılımı (aktif, bakımda, arızalı) burada gösterilecek." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: '0.75rem' }}>
                  {pieData.map((entry, i) => <Cell key={`c-${i}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
