import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Navigation, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  PenTool, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function DeliverPage({ user }) {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const [pack, setPack] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gpsError, setGpsError] = useState('');

  // Delivery OTP Verification states
  const [otpCode, setOtpCode] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('idle'); // 'idle', 'verifying', 'success'
  const [timeLeft, setTimeLeft] = useState(180);

  // Canvas Signature states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('delivered'); // delivered, partial, returned
  const [returnReason, setReturnReason] = useState('');

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.token;

  // Fetch package details (requires courier auth token)
  const fetchPackage = async () => {
    if (!token) {
      setError('Teslimat işlemleri için önce kurye panelinden giriş yapmalısınız.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${host}/api/teslimat/courier/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPack(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Paket bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Get GPS Location
  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Cihazınız GPS konum servislerini desteklemiyor.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        setGpsError('GPS koordinatları alınamadı. Lütfen konum izinlerini açın.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchPackage();
    getGPSLocation();
  }, [packageId]);

  // Countdown timer for OTP
  useEffect(() => {
    if (verifyStatus !== 'verifying') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setVerifyStatus('idle');
          setError('Doğrulama süresi doldu. Lütfen tekrar deneyin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyStatus]);

  // Polling for WhatsApp Reverse OTP verification status
  useEffect(() => {
    if (verifyStatus !== 'verifying' || !otpCode || !pack) return;
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`${host}/api/teslimat/deliver/status`, {
          params: { phone_number: pack.recipient_phone, code: otpCode },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.verified) {
          clearInterval(poll);
          setVerifyStatus('success');
        }
      } catch (err) {
        console.error('OTP kontrol hatası:', err);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [verifyStatus, otpCode, pack]);

  const startVerification = () => {
    setError('');
    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setVerifyStatus('verifying');
    setTimeLeft(180);
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Get mouse/touch coordinates safely
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#38bdf8'; // Blue-sky signature ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Confirm delivery and submit coordinates + compressed base64 signature
  const handleConfirmDelivery = async () => {
    if (!coords) {
      setError('Teslimat kanıtı için GPS koordinatları gereklidir.');
      return;
    }
    
    setActionLoading(true);
    setError('');

    let signatureBase64 = null;
    const canvas = canvasRef.current;
    if (canvas) {
      // Create a temporary smaller canvas to compress signature
      const tempCanvas = document.createElement('canvas');
      const max_size = 200; // Small signature
      tempCanvas.width = max_size;
      tempCanvas.height = max_size * (canvas.height / canvas.width);
      
      const tempCtx = tempCanvas.getContext('2d');
      // Draw background white for visibility
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      
      signatureBase64 = tempCanvas.toDataURL('image/jpeg', 0.6);
    }

    try {
      const res = await axios.post(`${host}/api/teslimat/deliver/confirm`, {
        package_id: packageId,
        gps_latitude: coords.latitude,
        gps_longitude: coords.longitude,
        recipient_signature_base64: signatureBase64,
        status: deliveryStatus,
        return_reason: deliveryStatus !== 'delivered' ? returnReason : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(res.data.message);
      setSignatureSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Teslimat onaylanırken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <Clock className="spin" size={48} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
          <p className="text-muted">Paket detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const waMessage = `TSLM ${otpCode}`;
  const waLink = `https://wa.me/905303700589?text=${encodeURIComponent(waMessage)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(waLink)}`;

  return (
    <div style={containerStyle}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 460, padding: '2rem 1.5rem', textAlign: 'center' }}>
        
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Paneli Aç
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>v1.7.10</span>
        </div>

        {/* Courier Auth Warning */}
        {!user && (
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} color="#fbbf24" style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>Kurye Oturumu Bulunmuyor</div>
            <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>Lütfen teslimat yönetimi için önce kurye panelinden giriş yapın.</p>
          </div>
        )}

        {pack ? (
          <div>
            {/* Package Info Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Package size={28} />
              </div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{pack.package_code} Teslimatı</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--brand-secondary)', fontWeight: 600 }}>{pack.company_name} Gönderisi</div>
            </div>

            {/* Recipient Details */}
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <User size={14} className="text-muted" />
                <span style={{ fontWeight: 600 }}>Alıcı:</span>
                <span>{pack.recipient_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Phone size={14} className="text-muted" />
                <span style={{ fontWeight: 600 }}>Telefon:</span>
                <span>{pack.recipient_phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.85rem' }}>
                <MapPin size={14} className="text-muted" style={{ marginTop: 2 }} />
                <span style={{ fontWeight: 600 }}>Adres:</span>
                <span>{pack.delivery_address}</span>
              </div>
            </div>

            {/* Error or Success Msg */}
            {error && (
              <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 10, fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--status-success)', borderRadius: 10, fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Teslim Edildi!</div>
                <div style={{ marginTop: 4 }}>{successMsg}</div>
              </div>
            )}

            {/* Main Delivery Flow Stages */}
            {!signatureSaved && (
              <div>
                {/* STAGE 1: GPS verification */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)' }}>
                      <Navigation size={15} /> Konum Saptama
                    </span>
                    <button 
                      onClick={getGPSLocation} 
                      disabled={gpsLoading}
                      style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Yenile
                    </button>
                  </div>
                  {gpsError ? (
                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 6 }}>{gpsError}</div>
                  ) : coords ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: 6, display: 'flex', gap: 4 }}>
                      <span>GPS Koordinatları Alındı:</span>
                      <span style={{ fontFamily: 'monospace' }}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Konum aranıyor...</div>
                  )}
                </div>

                {/* STAGE 2: Reverse OTP Verification */}
                {verifyStatus === 'idle' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button 
                      onClick={startVerification} 
                      disabled={!user}
                      className="btn-primary" 
                      style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <ShieldCheck size={18} /> Alıcı Kimliğini WhatsApp İle Doğrula
                    </button>
                  </div>
                )}

                {verifyStatus === 'verifying' && (
                  <div className="glass-card" style={{ padding: '1.5rem 1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>WhatsApp Teslim Doğrulaması</h3>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                      Alıcı, aşağıdaki QR kodu telefonuyla okutmalı veya alttaki WhatsApp butonuna tıklayıp onay mesajını göndermelidir.
                    </p>

                    <div style={{ background: 'white', padding: '0.5rem', borderRadius: 8, display: 'inline-block', marginBottom: '1rem' }}>
                      <img src={qrCodeUrl} alt="Confirm QR" style={{ width: 130, height: 130, display: 'block' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <a 
                        href={waLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', textDecoration: 'none', padding: '0.65rem', fontSize: '0.85rem' }}
                      >
                        <MessageSquare size={16} /> WhatsApp Uygulamasını Aç
                      </a>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--brand-secondary)', fontWeight: 600 }}>
                      <Clock size={14} />
                      Kalan Süre: {formatTime(timeLeft)}
                    </div>
                  </div>
                )}

                {/* STAGE 3: OTP Verified, Display Signature Canvas pad */}
                {verifyStatus === 'success' && (
                  <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--status-success)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
                      <ShieldCheck size={18} /> WhatsApp Doğrulaması Başarılı!
                    </div>

                    <label className="text-muted" style={{ display: 'block', fontSize: '0.8rem', textAlign: 'left', marginBottom: '0.5rem' }}>
                      <PenTool size={13} style={{ marginRight: 3, verticalAlign: 'middle' }} /> Alıcı Dijital İmzası
                    </label>
                    
                    <div style={{ border: '2px dashed var(--glass-border)', borderRadius: 8, overflow: 'hidden', background: '#ffffff', touchAction: 'none' }}>
                      <canvas 
                        ref={canvasRef}
                        width={380}
                        height={180}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      <button 
                        onClick={clearCanvas} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                      >
                        <RotateCcw size={12} /> İmzayı Temizle
                      </button>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>Parmağınızla çizin.</span>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>İşlem Sonucu</label>
                      <select style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)' }} value={deliveryStatus} onChange={e => setDeliveryStatus(e.target.value)}>
                        <option value="delivered">Tam Teslimat (Başarılı)</option>
                        <option value="partial">Kısmi Teslimat (Eksik/Hasarlı)</option>
                        <option value="returned">İade Edildi (Teslim Edilemedi)</option>
                      </select>
                    </div>

                    {deliveryStatus !== 'delivered' && (
                      <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Neden (Zorunlu Değil)</label>
                        <input type="text" placeholder="Açıklama giriniz..." style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)' }} value={returnReason} onChange={e => setReturnReason(e.target.value)} />
                      </div>
                    )}

                    <button 
                      onClick={handleConfirmDelivery}
                      disabled={actionLoading || (deliveryStatus !== 'delivered' && returnReason.length < 3)}
                      className={deliveryStatus === 'delivered' ? "btn-primary" : deliveryStatus === 'partial' ? "btn-outline" : "btn-outline"}
                      style={{ width: '100%', padding: '0.85rem', marginTop: '1.5rem', borderColor: deliveryStatus === 'returned' ? '#ef4444' : deliveryStatus === 'partial' ? '#f59e0b' : '', color: deliveryStatus === 'returned' ? '#ef4444' : deliveryStatus === 'partial' ? '#f59e0b' : '' }}
                    >
                      {actionLoading ? 'İşleniyor...' : deliveryStatus === 'delivered' ? 'Teslimatı Tamamla' : deliveryStatus === 'partial' ? 'Kısmi Teslimatı Kaydet' : 'İadeyi Kaydet'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted" style={{ padding: '2rem' }}>Gönderi kaydı bulunamadı.</div>
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
  background: '#0b1329' // Deep dark blue-gray background for mobile
};
