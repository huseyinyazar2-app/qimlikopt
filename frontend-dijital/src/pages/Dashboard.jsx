import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, QrCode, Search, Wrench, AlertCircle, CheckCircle, ExternalLink, Calendar, MapPin } from 'lucide-react';

export default function Dashboard({ user }) {
  const isCompany = user?.role === 'company';
  
  const [machines, setMachines] = useState([]);
  const [forms, setForms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Machine form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [location, setLocation] = useState('');
  const [formId, setFormId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Technician states
  const [scanCode, setScanCode] = useState('');
  const [techLogs, setTechLogs] = useState([]);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.password;

  const fetchCompanyData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resM = await axios.get(`${host}/api/dijital/machines`, { headers });
      setMachines(resM.data);
      const resF = await axios.get(`${host}/api/dijital/forms`, { headers });
      setForms(resF.data);
    } catch (err) {
      console.error('Veriler yüklenirken hata oluştu:', err);
    }
  };

  const fetchTechData = async () => {
    try {
      const res = await axios.get(`${host}/api/dijital/technician/${user.id}/logs`);
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
  }, []);

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
          form_template_id: formId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setCode('');
      setName('');
      setModel('');
      setSerial('');
      setLocation('');
      setFormId('');
      fetchCompanyData();
    } catch (err) {
      setError(err.response?.data?.error || 'Makine eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
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

        {/* QR Scan Simulation Card */}
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
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
            />
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={18} /> Ekranı Aç
            </button>
          </form>
        </div>

        {/* Recent actions list */}
        {techLogs.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--brand-primary)" /> Son Servis Verdiğiniz Cihazlar
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {techLogs.slice(0, 5).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', fontFamily: 'monospace', marginRight: '0.5rem' }}>{log.machine_code}</span>
                    <strong style={{ color: 'white' }}>{log.machine_name}</strong>
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
          <h1 className="gradient-text">Makine & Ekipman Yönetimi</h1>
          <p className="text-muted">QR kodlu envanterinizi listeleyin, durumlarını takip edin ve yeni ekipman ekleyin.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Yeni Makine Ekle
        </button>
      </header>

      {/* Search and Statistics bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Makine adı, kodu veya konuma göre ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: 8, outline: 'none' }}
          />
        </div>
      </div>

      {/* Grid of machines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredMachines.map(m => {
          const qrLink = `${window.location.protocol}//${window.location.host}/m/${m.machine_code}`;
          const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrLink)}`;

          return (
            <div key={m.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', marginRight: '0.5rem', fontFamily: 'monospace' }}>{m.machine_code}</span>
                    <span className={`badge ${m.status === 'active' ? 'success' : m.status === 'maintenance' ? 'warning' : 'error'}`}>
                      {m.status === 'active' ? 'Aktif' : m.status === 'maintenance' ? 'Bakımda' : 'Arızalı'}
                    </span>
                  </div>
                  <a href={`/m/${m.machine_code}`} target="_blank" rel="noreferrer" title="Detay Ekranını Aç" style={{ color: 'var(--brand-primary)' }}>
                    <ExternalLink size={18} />
                  </a>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'white' }}>{m.machine_name}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <MapPin size={14} className="text-muted" />
                    <span>Konum: {m.location || '-'}</span>
                  </div>
                  <div>Model / Seri No: {m.model || '-'} / {m.serial_number || '-'}</div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem', color: 'var(--brand-secondary)' }}>
                    Atanan Form: <strong>{m.form_title || 'Yok'}</strong>
                  </div>
                </div>
              </div>

              {/* QR Image Download Area */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: 8, padding: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {filteredMachines.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kayıtlı makine/ekipman bulunamadı.</p>
          </div>
        )}
      </div>

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
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Bulunduğu Konum</label>
                <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Örn: B Blok Kat -2 Jeneratör Odası" />
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
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Ekleniyor...' : 'Ekle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#1e293b', color: 'white', outline: 'none', boxSizing: 'border-box'
};
