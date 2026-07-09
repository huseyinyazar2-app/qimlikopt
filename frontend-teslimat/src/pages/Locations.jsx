import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Map, Info, Compass, HelpCircle } from 'lucide-react';

export default function Locations({ user }) {
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // New location states
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState(50); // defaults to 50 meters
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.token;

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${host}/api/mesai/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(res.data);
    } catch (err) {
      console.error('Lokasyonlar yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Geçerli enlem ve boylam girin.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${host}/api/mesai/locations`,
        {
          location_name: name,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          allowed_radius: parseInt(radius)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false);
      setName('');
      setLatitude('');
      setLongitude('');
      setRadius(50);
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.error || 'Çalışma alanı eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fillDummyCoordinates = () => {
    // Fill Ankaranın merkezi or dynamic mock coordinates for quick testing
    setLatitude('39.92077');
    setLongitude('32.85411');
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">Çalışma Alanları & Şantiyeler</h1>
          <p className="text-muted">Sahadaki koordinat sınırlarını ve personelinizin okutacağı check-in QR kodlarını yönetin.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Yeni Çalışma Alanı
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {locations.map(loc => {
          const qrLink = `${window.location.protocol}//${window.location.host}/check/${loc.id}`;
          const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrLink)}`;

          return (
            <div key={loc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand-primary)' }}>
                  <MapPin size={22} />
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>{loc.location_name}</h3>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Compass size={14} className="text-muted" />
                    <span>Koordinat: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</span>
                  </div>
                  <div>Tolerans Yarıçapı: <strong>{loc.allowed_radius} metre</strong></div>
                </div>
              </div>

              {/* QR Image Download Area */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: 8, padding: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={qrImage} alt="Location QR" style={{ width: 64, height: 64, display: 'block', borderRadius: 4, background: 'white', padding: 2 }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Giriş/Çıkış QR Kodu</div>
                  <a href={qrImage} download={`${loc.location_name}_qr.png`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', textDecoration: 'none', display: 'block', marginTop: 4 }}>
                    Görseli İndir
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {locations.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
            <Map size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kayıtlı çalışma alanı bulunamadı. Lütfen yeni bir lokasyon tanımlayın.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 450 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Yeni Lokasyon Tanımla</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Personelinizin sadece bu sınırlar içinde check-in yapmasına izin verilir.</p>

            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Çalışma Alanı / Şantiye Adı</label>
                <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Kadıköy Şantiyesi veya A Ofisi" />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Enlem (Latitude)</label>
                  <input required style={inputStyle} value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Örn: 39.9207" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Boylam (Longitude)</label>
                  <input required style={inputStyle} value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Örn: 32.8541" />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: -5 }}>
                <button type="button" onClick={fillDummyCoordinates} className="text-muted" style={{ background: 'transparent', border: 'none', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--brand-primary)' }}>
                  Örnek Koordinatları Doldur (Ankara Merkez)
                </button>
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>İzin Verilen Hata Toleransı (Yarıçap - Metre)</label>
                <input required type="number" style={inputStyle} value={radius} onChange={e => setRadius(e.target.value)} placeholder="Tolerans yarıçapı (örn: 50)" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
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
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
