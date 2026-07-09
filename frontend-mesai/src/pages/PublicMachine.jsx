import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config';
import { ShieldCheck, MapPin, Wrench, Calendar, Camera, CheckCircle, ArrowLeft, LogIn } from 'lucide-react';

export default function PublicMachine({ user }) {
  const { code } = useParams();
  const navigate = useNavigate();

  const [machineData, setMachineData] = useState(null); // { machine, form }
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form input states (for technician)
  const [formData, setFormData] = useState({});
  const [statusAfter, setStatusAfter] = useState('active');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null); // Base64 compressed image

  const host = getApiUrl();
  const isTechnician = user?.role === 'technician';

  const fetchMachineDetails = async () => {
    try {
      const res = await axios.get(`${host}/api/dijital/public/machine/${code}`);
      setMachineData(res.data);
      setStatusAfter(res.data.machine.status);

      // Prepopulate form states based on template
      const initialForm = {};
      res.data.form.fields.forEach(f => {
        if (f.type === 'boolean') {
          initialForm[f.label] = false;
        } else {
          initialForm[f.label] = '';
        }
      });
      setFormData(initialForm);

      const historyRes = await axios.get(`${host}/api/dijital/public/machine/${code}/history`);
      setHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ekipman bilgileri alınamadı.');
    }
  };

  useEffect(() => {
    fetchMachineDetails();
  }, [code]);

  // Client-side image compression logic
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_size = 500; // max resolution
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to 60% quality jpeg
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setPhoto(compressedBase64);
      };
    };
  };

  const handleFormChange = (label, value) => {
    setFormData({
      ...formData,
      [label]: value
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${host}/api/dijital/maintenance/submit`, {
        machine_id: machineData.machine.id,
        technician_id: user.id,
        form_data: formData,
        status_after: statusAfter,
        notes,
        photo_base64: photo
      });
      setSuccess(true);
      setNotes('');
      setPhoto(null);
      fetchMachineDetails();
    } catch (err) {
      alert('Rapor gönderilemedi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={containerStyle}>
        <div className="glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Hata</div>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!machineData) {
    return (
      <div style={containerStyle}>
        <p className="text-muted">Cihaz detayları yükleniyor...</p>
      </div>
    );
  }

  const { machine, form } = machineData;

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Logo / Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={28} color="#0284c7" />
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Qimlik Dijital</span>
          </div>
          {user && (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              <ArrowLeft size={14} /> Panele Dön
            </button>
          )}
        </div>

        {/* Machine Details Card */}
        <div className="glass-card" style={{ borderLeft: `4px solid ${machine.status === 'active' ? 'var(--status-success)' : machine.status === 'maintenance' ? 'var(--status-warning)' : 'var(--status-error)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{machine.machine_code}</span>
            <span className={`badge ${machine.status === 'active' ? 'success' : machine.status === 'maintenance' ? 'warning' : 'error'}`}>
              {machine.status === 'active' ? 'Aktif' : machine.status === 'maintenance' ? 'Bakımda' : 'Arızalı'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{machine.machine_name}</h2>
          <div className="text-muted" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <MapPin size={14} />
            <span>{machine.location}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Şirket: {machine.company_name} | Model: {machine.model || '-'} | Seri: {machine.serial_number || '-'}
          </div>
        </div>

        {/* Technician Form (Authorized Technician View) */}
        {isTechnician ? (
          <div className="glass-card" style={{ border: success ? '1px solid var(--status-success)' : '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wrench size={18} color="var(--brand-primary)" /> Servis / Bakım Raporu Doldur
            </h3>

            {success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle size={24} />
                </div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Rapor Başarıyla Gönderildi!</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Ekipman kontrol verileri ve durum güncellendi.</p>
                <button onClick={() => setSuccess(false)} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Yeni Rapor Gir</button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-secondary)', marginBottom: '0.75rem' }}>Form Şablonu: {form.title}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {form.fields.map(f => (
                      <div key={f.id}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{f.label}</label>
                        {f.type === 'text' && (
                          <input required style={formInputStyle} value={formData[f.label] || ''} onChange={e => handleFormChange(f.label, e.target.value)} placeholder="Metin girin..." />
                        )}
                        {f.type === 'number' && (
                          <input required type="number" style={formInputStyle} value={formData[f.label] || ''} onChange={e => handleFormChange(f.label, e.target.value)} placeholder="Sayı girin..." />
                        )}
                        {f.type === 'boolean' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" checked={formData[f.label] || false} onChange={e => handleFormChange(f.label, e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                            <span style={{ fontSize: '0.85rem' }}>Evet / Doğrulandı</span>
                          </div>
                        )}
                        {f.type === 'select' && (
                          <select required style={formSelectStyle} value={formData[f.label] || ''} onChange={e => handleFormChange(f.label, e.target.value)}>
                            <option value="">Seçim yapın...</option>
                            {f.options.map((opt, idx) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo upload and base64 compression display */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kanıt Fotoğrafı Yükle (Otomatik Sıkıştırılır)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                      <Camera size={18} /> Fotoğraf Seç / Çek
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                    {photo && (
                      <div style={{ position: 'relative', border: '1px solid var(--glass-border)', padding: 4, borderRadius: 6, background: 'rgba(15,23,42,0.03)' }}>
                        <img src={photo} alt="Preview" style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 4 }} />
                        <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--status-success)', color: 'var(--text-primary)', borderRadius: '50%', width: 14, height: 14, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 750 }}>✓</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Cihaz Durum Güncellemesi</label>
                  <select required style={formSelectStyle} value={statusAfter} onChange={e => setStatusAfter(e.target.value)}>
                    <option value="active">Aktif (Sorunsuz)</option>
                    <option value="maintenance">Bakımda (Servis Gerekli)</option>
                    <option value="broken">Arızalı (Kullanım Dışı)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Servis Notları</label>
                  <textarea style={{ ...formInputStyle, height: '80px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Yapılan parça değişimi, genel durum veya servis detaylarını girin..."></textarea>
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem' }}>
                  {loading ? 'Gönderiliyor...' : 'Raporu Tamamla ve Gönder'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Public Guest view - Prompt to login as technician to fill reports */
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Bu makineye servis/bakım raporu girmek için sisteme kayıtlı yetkili teknisyen girişi yapmanız gerekmektedir.
            </p>
            <a 
              href={`/login`} 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              <LogIn size={18} /> Teknisyen Girişi Yap
            </a>
          </div>
        )}

        {/* Maintenance Log History List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Calendar size={18} /> Geçmiş Bakım ve Servis Kayıtları
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map(h => (
              <div key={h.id} style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <strong>Teknisyen: {h.technician_name}</strong>
                  <span className="text-muted">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Durum: <span style={{ fontWeight: 600 }}>{h.status_after === 'active' ? 'Aktif' : h.status_after === 'maintenance' ? 'Bakımda' : 'Arızalı'}</span>
                </div>
                {h.notes && <div className="text-muted" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>" {h.notes} "</div>}
                
                {/* Photo link if uploaded */}
                {h.photo_base64 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={h.photo_base64} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                      [ Ekli Fotoğrafı Görüntüle ]
                    </a>
                  </div>
                )}
              </div>
            ))}

            {history.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', margin: 0, padding: '1rem' }}>Bu makine için geçmiş servis kaydı bulunmamaktadır.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const containerStyle = {
  fontFamily: "'Inter', sans-serif",
  minHeight: '100vh',
  background: '#0f172a',
  color: '#cbd5e1',
  display: 'flex',
  justifyContent: 'center',
  padding: '2.5rem 1.5rem',
  boxSizing: 'border-box'
};

const formInputStyle = {
  width: '100%', padding: '0.65rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '0.85rem'
};

const formSelectStyle = {
  width: '100%', padding: '0.65rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '0.85rem'
};
