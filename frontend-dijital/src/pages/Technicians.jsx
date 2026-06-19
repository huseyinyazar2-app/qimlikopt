import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Phone, User, CheckCircle, Pause, Play } from 'lucide-react';

export default function Technicians({ user }) {
  const [techs, setTechs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // New technician form
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.password; // For prototype we use password as token

  const fetchTechs = async () => {
    try {
      const res = await axios.get(`${host}/api/dijital/technicians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTechs(res.data);
    } catch (err) {
      console.error('Teknisyen listesi alınamadı:', err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${host}/api/dijital/technicians/${id}/toggle`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTechs();
    } catch (err) {
      console.error('Durum değiştirilemedi:', err);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${host}/api/dijital/technicians`,
        { name, surname, phone_number: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false);
      setName('');
      setSurname('');
      setPhone('');
      fetchTechs();
    } catch (err) {
      setError(err.response?.data?.error || 'Teknisyen eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">Teknisyen Yönetimi</h1>
          <p className="text-muted">Sahada makine bakımı yapacak yetkili teknik personellerinizi yönetin.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Yeni Teknisyen
        </button>
      </header>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Adı Soyadı</th>
                <th>Telefon Numarası</th>
                <th>Kayıt Tarihi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {techs.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name} {t.surname}</td>
                  <td>{t.phone_number}</td>
                  <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${t.is_active ? 'success' : 'error'}`}>
                      {t.is_active ? 'Aktif' : 'Askıda'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(t.id, t.is_active)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
                      title={t.is_active ? "Askıya Al" : "Aktifleştir"}
                    >
                      {t.is_active ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
              {techs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Kayıtlı teknisyen bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Teknisyen Ekle</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Adı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Mehmet" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Soyadı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={surname} onChange={e => setSurname(e.target.value)} placeholder="Örn: Yılmaz" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Telefon Numarası (WhatsApp ile Giriş İçin)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Örn: +905XXXXXXXXX" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', boxSizing: 'border-box'
};
