import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, ShieldCheck, Navigation, LogIn, LogOut, RefreshCw, AlertTriangle, UserCheck, ArrowLeft } from 'lucide-react';
import { getApiUrl } from '../config';

export default function CheckPage({ user }) {
  const { locationId } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gpsError, setGpsError] = useState('');

  const host = getApiUrl();

  // Fetch location details
  const fetchLocation = async () => {
    try {
      const res = await axios.get(`${host}/api/mesai/public/locations/${locationId}`);
      setLocation(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Çalışma alanı bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Get GPS Coordinates
  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Tarayıcınız GPS konum servislerini desteklemiyor.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCoords({ latitude: lat, longitude: lon });
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum izni verin.');
        } else {
          setGpsError('GPS konumu alınamadı. Lütfen cihazınızın konum servislerini açın.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchLocation();
    getGPSLocation();
  }, [locationId]);

  // Calculate distance on client-side for immediate display
  useEffect(() => {
    if (!coords || !location) return;

    const R = 6371e3; // Earth radius in meters
    const lat1 = coords.latitude * Math.PI / 180;
    const lat2 = location.latitude * Math.PI / 180;
    const deltaLat = (location.latitude - coords.latitude) * Math.PI / 180;
    const deltaLon = (location.longitude - coords.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(Math.round(dist));
  }, [coords, location]);

  const handleCheck = async (type) => {
    if (!user) {
      setError('Lütfen önce giriş yapın.');
      return;
    }
    if (!coords) {
      setError('GPS konumu alınmadan işlem yapılamaz.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      const res = await axios.post(`${host}/api/mesai/check`, {
        employee_id: user.id,
        location_id: locationId,
        log_type: type,
        gps_latitude: coords.latitude,
        gps_longitude: coords.longitude
      });
      setSuccessMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="spin" size={48} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
          <p className="text-muted">Şantiye bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  const isWithinRadius = distance !== null && location && distance <= location.allowed_radius;

  return (
    <div style={containerStyle}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 460, padding: '2rem 1.5rem', textAlign: 'center' }}>
        
        {/* Back / Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Paneli Aç
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>v1.7.10</span>
        </div>

        {/* Location Info Header */}
        {location ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <MapPin size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{location.location_name}</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Koordinat sınırları dahilinde mesainizi yönetin.</p>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem', color: 'var(--status-error)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <div>Çalışma alanı bulunamadı!</div>
          </div>
        )}

        {/* User Info (Authentication Check) */}
        {!user ? (
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <AlertTriangle size={24} color="#fbbf24" style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 600, marginBottom: '0.75rem' }}>Kimliğiniz Doğrulanmadı</div>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 1rem 0' }}>Giriş/Çıkış yapabilmek için sisteme kayıtlı telefon numaranızla giriş yapmalısınız.</p>
            <button onClick={() => navigate('/')} className="btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
              Giriş Ekranına Git
            </button>
          </div>
        ) : user.role === 'company' ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>Firma Yetkilisi Girişi</div>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>Bu ekran sadece saha çalışanlarının giriş/çıkış yapması içindir.</p>
          </div>
        ) : (
          /* Employee Quick Profile Card */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1.5rem', textAlign: 'left' }}>
            {user.photo_base64 ? (
              <img src={user.photo_base64} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} />
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name} {user.surname}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.phone_number}</div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 10, fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--status-success)', borderRadius: 10, fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {successMsg}
          </div>
        )}

        {/* GPS Verification Module */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={16} /> GPS Doğrulama
            </span>
            <button 
              onClick={getGPSLocation} 
              disabled={gpsLoading} 
              style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} className={gpsLoading ? 'spin' : ''} /> Konumu Güncelle
            </button>
          </div>

          {gpsError ? (
            <div style={{ fontSize: '0.8rem', color: '#fbbf24', textAlign: 'center', padding: '0.5rem 0' }}>
              {gpsError}
            </div>
          ) : coords ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span className="text-muted">Mevcut Konumunuz:</span>
                <span style={{ fontFamily: 'monospace' }}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span className="text-muted">İzin Verilen Tolerans:</span>
                <span>{location?.allowed_radius} metre</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Merkeze Olan Mesafe:</span>
                {distance !== null ? (
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: isWithinRadius ? 'var(--status-success)' : '#ef4444' }}>
                    {distance} metre
                  </span>
                ) : (
                  <span>Hesaplanıyor...</span>
                )}
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                <span className={`badge ${isWithinRadius ? 'success' : 'error'}`} style={{ width: '100%', boxSizing: 'border-box', display: 'block', padding: '0.4rem', fontSize: '0.8rem' }}>
                  {isWithinRadius ? 'Sınırlar Dahilindesiniz' : 'Sınır Dışındasınız'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              GPS koordinatları alınıyor...
            </div>
          )}
        </div>

        {/* Check In / Out Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => handleCheck('check_in')} 
            disabled={actionLoading || !user || user.role !== 'employee' || !isWithinRadius}
            className="btn-primary"
            style={{ flex: 1, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.9rem' }}
          >
            <LogIn size={18} /> Mesaiye Başla
          </button>
          <button 
            onClick={() => handleCheck('check_out')} 
            disabled={actionLoading || !user || user.role !== 'employee' || !isWithinRadius}
            className="btn-outline"
            style={{ flex: 1, padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.9rem', border: '1px solid var(--status-warning)', color: 'var(--text-primary)', background: 'rgba(245, 158, 11, 0.05)' }}
          >
            <LogOut size={18} color="var(--status-warning)" /> Mesaiyi Bitir
          </button>
        </div>

      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: '#0b1329' // Deep dark blue-gray background for mobile
};
