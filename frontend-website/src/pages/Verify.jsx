import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, MessageSquare, CheckCircle, AlertTriangle, Clock, RefreshCw, XCircle } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const prefix = searchParams.get('prefix') || '';
  const code = searchParams.get('code') || '';
  const gatewayPhone = searchParams.get('gateway_phone') || '905303700589';
  const userPhone = searchParams.get('phone') || '';

  const [status, setStatus] = useState('waiting'); // 'waiting', 'success', 'expired', 'error'
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes countdown
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Verify inputs
  useEffect(() => {
    if (!prefix || !code) {
      setStatus('error');
      setErrorMessage('Prefix ve doğrulama kodu eksik. Lütfen parametreleri kontrol edin.');
    }
  }, [prefix, code]);

  // 2. Countdown Timer
  useEffect(() => {
    if (status !== 'waiting') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // 3. Polling for verification status
  useEffect(() => {
    if (status !== 'waiting') return;

    const host = window.location.hostname.endsWith('qimlik.com')
      ? 'https://api.qimlik.com'
      : `http://${window.location.hostname}:3303`;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${host}/api/client/verify-status`, {
          params: { prefix, code }
        });

        if (res.data.verified) {
          clearInterval(pollInterval);
          setStatus('success');

          // Notify parent window (Opener)
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'qimlik_verification',
                status: 'verified',
                prefix,
                code,
                user_phone: userPhone
              },
              '*'
            );
          }

          // Close window after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        console.error('Doğrulama durumu kontrol edilirken hata oluştu:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [status, prefix, code, userPhone]);

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Build WhatsApp deep link
  const cleanPhone = gatewayPhone.replace(/[^0-9]/g, '');
  const waMessage = `${prefix} ${code}`;
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waLink)}`;

  // Styling helper
  const containerStyle = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '1.5rem',
    boxSizing: 'border-box'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  if (status === 'error') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <XCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#991b1b' }}>Hata Oluştu</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#92400e' }}>Süre Doldu</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            Doğrulama işlemi için ayrılan 3 dakikalık süre dolmuştur. Lütfen işlemi başlatmış olduğunuz pencereden tekrar kod isteyin.
          </p>
          <button 
            onClick={() => window.close()} 
            style={{ width: '100%', padding: '0.85rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Penceriyi Kapat
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#065f46' }}>Doğrulama Başarılı!</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Kimliğiniz başarıyla doğrulanmıştır.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
            <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            Yönlendiriliyorsunuz, lütfen bekleyin...
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo / Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <ShieldCheck size={28} color="#0ea5e9" />
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Qimlik</span>
          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 4 }}>Güvenli Doğrulama</span>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>WhatsApp ile Doğrula</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
          {userPhone ? `${userPhone} numaralı telefonunuzu` : 'Telefon numaranızı'} doğrulamak için aşağıdaki adımlardan birini tamamlayın.
        </p>

        {/* QR Code Card */}
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
            Yöntem 1: QR Kodu WhatsApp ile Taratın
          </div>
          <div style={{ background: 'white', padding: '0.5rem', borderRadius: 8, display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
            <img src={qrCodeUrl} alt="WhatsApp QR Code" style={{ display: 'block', width: 150, height: 150 }} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.3 }}>
            Telefonunuzun kamerasını taratıp gelen hazır mesajı gönderin.
          </p>
        </div>

        {/* Deep Link Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
            Yöntem 2: Doğrudan WhatsApp Uygulamasını Açın
          </div>
          <a 
            href={waLink} 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              width: '100%', 
              padding: '0.85rem', 
              background: '#25d366', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
            }}
          >
            <MessageSquare size={18} /> WhatsApp ile Mesaj Gönder
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#f0f9ff', color: '#0369a1', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, marginBottom: '1rem' }}>
          <Clock size={16} />
          <span>Kalan Süre: <strong>{formatTime(timeLeft)}</strong></span>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.3 }}>
          * WhatsApp üzerinden gönderilecek mesaj metni: <strong>{prefix} {code}</strong><br />
          Lütfen mesajı değiştirmeden gönderin.
        </div>
      </div>
    </div>
  );
}
