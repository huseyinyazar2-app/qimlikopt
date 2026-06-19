import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Clipboard, User, MapPin, Phone, Search, HelpCircle, Truck, ExternalLink } from 'lucide-react';

export default function Packages({ user }) {
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New package states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.password;

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const resP = await axios.get(`${host}/api/teslimat/packages`, { headers });
      setPackages(resP.data);

      const resC = await axios.get(`${host}/api/teslimat/couriers`, { headers });
      // Only active couriers can be assigned packages
      setCouriers(resC.data.filter(c => c.is_active));
    } catch (err) {
      console.error('Veriler yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${host}/api/teslimat/packages`,
        {
          package_code: code,
          recipient_name: name,
          recipient_phone: phone,
          delivery_address: address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setCode('');
      setName('');
      setPhone('');
      setAddress('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gönderi oluşturulurken hata.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedCourierId) return;

    try {
      await axios.put(
        `${host}/api/teslimat/packages/${selectedPackId}/assign`,
        { courier_id: parseInt(selectedCourierId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAssignModal(false);
      setSelectedPackId(null);
      setSelectedCourierId('');
      fetchData();
    } catch (err) {
      console.error('Kurye atanamadı:', err);
    }
  };

  const generateDummyTrackingCode = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setCode(`PKG-${num}`);
  };

  const filteredPackages = packages.filter(p => 
    p.package_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.recipient_phone.includes(searchQuery)
  );

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Gönderi & Paket Yönetimi</h1>
          <p className="text-muted">Dağıtılacak gönderileri kaydedin, kuryeleri atayın ve barkod etiketleri oluşturun.</p>
        </div>
        <button 
          onClick={() => { setShowAddModal(true); generateDummyTrackingCode(); }} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          <Plus size={18} /> Yeni Gönderi Oluştur
        </button>
      </header>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Takip kodu, alıcı adı veya telefon numarasına göre ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Packages Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredPackages.map(p => {
          const qrLink = `${window.location.protocol}//${window.location.host}/deliver/${p.id}`;
          const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrLink)}`;
          
          return (
            <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', marginRight: '0.5rem', fontFamily: 'monospace' }}>{p.package_code}</span>
                    <span className={`badge ${p.status === 'delivered' ? 'success' : p.status === 'in_transit' ? 'warning' : p.status === 'failed' ? 'error' : 'secondary'}`}>
                      {p.status === 'delivered' ? 'Teslim Edildi' : p.status === 'in_transit' ? 'Dağıtımda' : p.status === 'failed' ? 'Hata' : 'Zimmet Bekliyor'}
                    </span>
                  </div>
                  
                  {/* Public Tracking Link */}
                  <a href={`/track/${p.package_code}`} target="_blank" rel="noreferrer" title="Kamu Alıcı Takip Ekranını Aç" style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.85rem', textDecoration: 'none' }}>
                    Takip <ExternalLink size={14} />
                  </a>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{p.recipient_name}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Phone size={14} className="text-muted" />
                    <span>Alıcı Tel: {p.recipient_phone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    <MapPin size={14} className="text-muted" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>Adres: {p.delivery_address}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={14} className="text-muted" />
                    <span>Zimmetli Kurye: <strong>{p.courier_name || 'Atanmamış'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Courier Assignment and QR label code */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {p.status === 'created' && (
                  <button 
                    onClick={() => { setSelectedPackId(p.id); setShowAssignModal(true); }}
                    className="btn-primary" 
                    style={{ padding: '0.55rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Truck size={16} /> Kuryeye Zimmetle
                  </button>
                )}

                {/* QR barcode download */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: 8, padding: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={qrImage} alt="Package QR" style={{ width: 52, height: 52, borderRadius: 4, background: 'white', padding: 2 }} />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Teslim QR Etiketi</div>
                    <a href={qrImage} download={`${p.package_code}_qr.png`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', textDecoration: 'none', display: 'block', marginTop: 2 }}>
                      Etiketi İndir
                    </a>
                  </div>
                </div>
              </div>

            </div>
          );
        })}

        {packages.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Package size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kayıtlı teslimat gönderisi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 450 }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Yeni Gönderi Oluştur</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Paket Kodu (Benzersiz)</label>
                <input required style={inputStyle} value={code} onChange={e => setCode(e.target.value)} placeholder="PKG-XXXXXX" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Alıcı Adı Soyadı</label>
                <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Hasan Yılmaz" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Alıcı Telefon (Reverse OTP için)</label>
                <input required style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Örn: +905XXXXXXXXX" />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Teslimat Adresi</label>
                <textarea required style={{ ...inputStyle, height: '70px', resize: 'none' }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Teslim edilecek açık adres..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Kaydediliyor...' : 'Gönderi Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Courier Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Kuryeye Zimmetle</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Lütfen bu gönderiyi zimmetlemek istediğiniz aktif kuryeyi seçin.</p>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Zimmetlenecek Kurye</label>
                <select 
                  required
                  value={selectedCourierId} 
                  onChange={e => setSelectedCourierId(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Kurye Seçin...</option>
                  {couriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.surname} ({c.phone_number})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowAssignModal(false); setSelectedPackId(null); }} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Zimmetle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
