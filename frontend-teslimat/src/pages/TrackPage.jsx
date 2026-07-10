import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '../config';

const FAIL_REASONS = {
  recipient_absent: 'Alıcı adreste yok',
  wrong_address: 'Adres hatalı',
  refused: 'Teslim reddedildi',
  other: 'Diğer'
};

export default function TrackPage() {
  const { token } = useParams();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const host = getApiUrl();

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${host}/api/teslimat/public/track/${token}`);
      setPack(res.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'Takip kaydı bulunamadı. Lütfen bağlantıyı kontrol edin.'
        : (err.response?.data?.error || 'Takip bilgileri alınamadı. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [token]);

  const status = pack?.status;
  const dispatched = ['in_transit', 'delivered', 'partial', 'returned', 'failed'].includes(status);
  const delivered = status === 'delivered';
  const isFailure = status === 'failed' || status === 'returned';
  const isPartial = status === 'partial';

  return (
    <div style={containerStyle}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: '2.5rem 2rem', textAlign: 'center' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-gradient)' }}></div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Qimlik <span style={{ fontWeight: 400, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Takip</span></span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem 0' }}>
            <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kargo bilgileri çekiliyor...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem 0' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Takip Başarısız</div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={fetchTrackingData} className="btn-outline" style={{ padding: '0.55rem 1rem' }}>Tekrar Dene</button>
          </div>
        ) : pack ? (
          <div>
            {/* Tracking summary */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GÖNDERİ KODU</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', margin: '0.25rem 0' }}>{pack.package_code}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>Gönderen Firma: <strong style={{ color: 'var(--brand-secondary)' }}>{pack.company_name}</strong></div>
            </div>

            {/* Recipient details (masked by backend) */}
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'left', marginBottom: '2rem', background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.85rem' }}>
                <User size={14} className="text-muted" />
                <span style={{ fontWeight: 600 }}>Alıcı:</span>
                <span>{pack.recipient_name}</span>
              </div>
            </div>

            {/* Failure / partial banner */}
            {isFailure && (
              <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', textAlign: 'left', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw color="#ef4444" size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{status === 'returned' ? 'Gönderi İade Edildi' : 'Teslim Edilemedi'}</div>
                  <div className="text-muted" style={{ marginTop: 2, fontSize: '0.8rem' }}>Gönderiniz alıcıya teslim edilemedi.</div>
                </div>
              </div>
            )}
            {isPartial && (
              <div className="glass-card" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '1rem', textAlign: 'left', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle color="#f59e0b" size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Kısmen Teslim</div>
                  <div className="text-muted" style={{ marginTop: 2, fontSize: '0.8rem' }}>Gönderinizin bir kısmı teslim edildi.</div>
                </div>
              </div>
            )}

            {/* Tracking Progress Steps */}
            <div style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '1rem' }}>
              {/* Step 1: Registered */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                <div style={lineStyle}></div>
                <div style={{ ...dotStyle, background: 'var(--status-success)', color: 'white' }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Kayıt Oluşturuldu</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(pack.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>

              {/* Step 2: Dispatched */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                <div style={lineStyle}></div>
                <div style={{
                  ...dotStyle,
                  background: dispatched ? 'var(--status-success)' : 'rgba(15,23,42,0.08)',
                  color: dispatched ? 'white' : 'var(--text-muted)'
                }}>
                  {dispatched ? '✓' : '2'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: dispatched ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>Yola Çıktı</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {dispatched ? 'Kurye dağıtıma çıktı.' : 'Kurye ataması bekleniyor.'}
                  </div>
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{
                  ...dotStyle,
                  background: delivered ? 'var(--status-success)' : isFailure ? 'rgba(239,68,68,0.15)' : 'rgba(15,23,42,0.08)',
                  color: delivered ? 'white' : isFailure ? '#ef4444' : 'var(--text-muted)'
                }}>
                  {delivered ? '✓' : isFailure ? '✕' : '3'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: delivered ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>Teslim Edildi</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {delivered && pack.delivered_at
                      ? `Doğrulandı: ${new Date(pack.delivered_at).toLocaleString('tr-TR')}`
                      : isFailure
                        ? 'Teslim edilemedi.'
                        : 'Paket henüz teslim edilmedi.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Failed attempts detail */}
            {pack.failed_attempts > 0 && (
              <div className="glass-card" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', textAlign: 'left', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Başarısız teslim denemesi: {pack.failed_attempts}</div>
                {pack.last_fail_reason && FAIL_REASONS[pack.last_fail_reason] && (
                  <div className="text-muted" style={{ marginTop: 2 }}>Son neden: {FAIL_REASONS[pack.last_fail_reason]}</div>
                )}
              </div>
            )}

            {/* Delivery point (text only, no map for public/mobile) */}
            {pack.delivery_point && (
              <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', textAlign: 'left', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="var(--status-success)" size={20} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Teslim Noktası</div>
                  <div className="text-muted" style={{ marginTop: 2 }}>
                    {pack.delivery_point.latitude.toFixed(5)}, {pack.delivery_point.longitude.toFixed(5)}
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
  background: 'rgba(15,23,42,0.05)'
};
