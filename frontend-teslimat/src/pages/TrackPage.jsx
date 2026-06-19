import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

export default function TrackPage() {
  const { packageCode } = useParams();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const host = `http://${window.location.hostname}:3303`;

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${host}/api/teslimat/public/packages/${packageCode}`);
      setPack(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Paket bulunamadı. Lütfen takip kodunu kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [packageCode]);

  // Helper to censor recipient name (e.g., Hasan Yılmaz -> H**** Y***** )
  const censorName = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(part.length - 1);
    }).join(' ');
  };

  return (
    <div style={containerStyle}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: '2.5rem 2rem', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>Qimlik <span style={{ fontWeight: 400, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Takip</span></span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem 0' }}>
            <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kargo bilgileri çekiliyor...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem 0' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>Takip Başarısız</div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={fetchTrackingData} className="btn-outline" style={{ padding: '0.55rem 1rem' }}>Tekrar Dene</button>
          </div>
        ) : pack ? (
          <div>
            {/* Tracking summary */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GÖNDERİ KODU</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'white', margin: '0.25rem 0' }}>{pack.package_code}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>Gönderen Firma: <strong style={{ color: 'var(--brand-secondary)' }}>{pack.company_name}</strong></div>
            </div>

            {/* Censor Recipient details */}
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'left', marginBottom: '2rem', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.85rem' }}>
                <User size={14} className="text-muted" />
                <span style={{ fontWeight: 600 }}>Alıcı:</span>
                <span>{censorName(pack.recipient_name)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.85rem', alignItems: 'flex-start' }}>
                <MapPin size={14} className="text-muted" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>Teslim Adresi:</span>
                <span>{pack.delivery_address}</span>
              </div>
            </div>

            {/* Tracking Progress Steps */}
            <div style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '1rem' }}>
              {/* Step 1: Shipment Registered */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                <div style={lineStyle}></div>
                <div style={{ ...dotStyle, background: 'var(--status-success)', color: 'white' }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>Gönderi Kaydı Alındı</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(pack.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>

              {/* Step 2: Courier Zimmeted */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                <div style={lineStyle}></div>
                <div style={{ 
                  ...dotStyle, 
                  background: pack.status === 'in_transit' || pack.status === 'delivered' ? 'var(--status-success)' : 'rgba(255,255,255,0.08)',
                  color: pack.status === 'in_transit' || pack.status === 'delivered' ? 'white' : 'var(--text-muted)'
                }}>
                  {pack.status === 'in_transit' || pack.status === 'delivered' ? '✓' : '2'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: pack.status === 'in_transit' || pack.status === 'delivered' ? 'white' : 'var(--text-muted)', fontSize: '0.9rem' }}>Dağıtıma Çıkarıldı</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {pack.status === 'in_transit' || pack.status === 'delivered' ? 'Zimmet atandı ve kurye yolda.' : 'Kurye ataması bekleniyor.'}
                  </div>
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ 
                  ...dotStyle, 
                  background: pack.status === 'delivered' ? 'var(--status-success)' : 'rgba(255,255,255,0.08)',
                  color: pack.status === 'delivered' ? 'white' : 'var(--text-muted)'
                }}>
                  {pack.status === 'delivered' ? '✓' : '3'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: pack.status === 'delivered' ? 'white' : 'var(--text-muted)', fontSize: '0.9rem' }}>Teslim Edildi</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {pack.status === 'delivered' 
                      ? `Doğrulandı: ${new Date(pack.delivered_at).toLocaleString('tr-TR')}` 
                      : 'Paket henüz teslim edilmedi.'}
                  </div>
                </div>
              </div>
            </div>

            {/* GPS verification label */}
            {pack.status === 'delivered' && pack.gps_latitude && (
              <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="var(--status-success)" size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'white' }}>Güvenli Teslimat Konumu</div>
                  <div className="text-muted" style={{ marginTop: 2 }}>
                    Alıcı, WhatsApp Reverse OTP doğrulamasıyla şu koordinatlarda onay vermiştir: {pack.gps_latitude.toFixed(5)}, {pack.gps_longitude.toFixed(5)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted">Kargo bilgisi bulunmuyor.</div>
        )}

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
  background: '#0f172a'
};

const dotStyle = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  zIndex: 1,
  flexShrink: 0
};

const lineStyle = {
  position: 'absolute',
  left: 11,
  top: 24,
  bottom: -20,
  width: 2,
  background: 'rgba(255,255,255,0.08)'
};
