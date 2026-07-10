import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Phone, User, Pause, Play, X, Search, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config';
import { isReadOnly } from '../utils/role';
import EmptyState from '../components/EmptyState';

export default function Couriers({ user }) {
  const readOnly = isReadOnly();
  const [couriers, setCouriers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New courier states
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = getApiUrl();
  const token = user?.token;

  const fetchCouriers = async () => {
    try {
      const res = await axios.get(`${host}/api/teslimat/couriers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCouriers(res.data);
    } catch (err) {
      console.error('Kurye listesi yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${host}/api/teslimat/couriers`,
        { name, surname, phone_number: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setName('');
      setSurname('');
      setPhone('');
      fetchCouriers();
    } catch (err) {
      setError(err.response?.data?.error || 'Kurye eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${host}/api/teslimat/couriers/${id}/toggle`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCouriers();
    } catch (err) {
      console.error('Kurye durumu değiştirilemedi:', err);
    }
  };

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone_number.includes(searchQuery)
  );

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Kurye Personel Yönetimi</h1>
          <p className="text-muted">Paketlerinizi zimmetleyeceğiniz kuryeleri tanımlayın ve durumlarını yönetin.</p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> Yeni Kurye Tanımla
          </button>
        )}
      </header>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="İsim, soyisim veya telefona göre ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Couriers List Card */}
      <div className="glass-card">
        {couriers.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="Henüz kurye yok"
            description="Paketlerinizi zimmetleyebilmek için önce bir kurye personeli tanımlayın. Kurye, teslimat ekranına telefonuyla giriş yapar."
            actionLabel={readOnly ? undefined : 'Yeni Kurye Tanımla'}
            onAction={readOnly ? undefined : () => setShowAddModal(true)}
          />
        ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Kurye</th>
                <th>Telefon</th>
                <th>Kayıt Tarihi</th>
                <th>Durum</th>
                {!readOnly && <th>İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCouriers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name} {c.surname}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{c.phone_number}</td>
                  <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${c.is_active ? 'success' : 'error'}`}>
                      {c.is_active ? 'Aktif' : 'Askıda'}
                    </span>
                  </td>
                  {!readOnly && (
                    <td>
                      <button
                        onClick={() => toggleStatus(c.id, c.is_active)}
                        className={c.is_active ? "btn-outline" : "btn-primary"}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, width: '100px', justifyContent: 'center' }}
                      >
                        {c.is_active ? <Pause size={12} /> : <Play size={12} />}
                        {c.is_active ? 'Askıya Al' : 'Aktifleştir'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredCouriers.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 4 : 5} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">Aramanızla eşleşen kurye bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Add Courier Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Yeni Kurye Kaydet</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Kurye Adı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Mehmet" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Kurye Soyadı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={surname} onChange={e => setSurname(e.target.value)} placeholder="Örn: Yıldırım" />
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
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
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
  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
