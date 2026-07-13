import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ShieldCheck, MessageSquare, Smartphone, CheckCircle2,
  Clock, RefreshCw, Play, ArrowRight,
} from 'lucide-react';
import PageHero from '../components/PageHero';
import { getApiUrl, GATEWAY_PHONE, GATEWAY_PHONE_DISPLAY } from '../config';

// Web sitesinde canli, gercek reverse-OTP denemesi.
// Ziyaretci "DEMO <kod>" mesajini gateway numarasina (WhatsApp veya SMS) gonderir;
// backend logs'a "success" yazar; bu sayfa verify-status ile dogrulamayi yakalar.
const DEMO_PREFIX = 'DEMO';
const COUNTDOWN = 180; // saniye

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function TryIt() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | success | expired
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const message = `${DEMO_PREFIX} ${code}`;
  const waLink = `https://wa.me/${GATEWAY_PHONE}?text=${encodeURIComponent(message)}`;
  const smsLink = `sms:+${GATEWAY_PHONE}?body=${encodeURIComponent(message)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}`;

  const stop = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  };

  useEffect(() => () => stop(), []);

  const start = () => {
    stop();
    const c = genCode();
    setCode(c);
    setTimeLeft(COUNTDOWN);
    setPhase('waiting');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stop();
          setPhase('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const host = getApiUrl();
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${host}/api/client/verify-status`, {
          params: { prefix: DEMO_PREFIX, code: c },
        });
        if (res.data.verified) {
          stop();
          setPhase('success');
        }
      } catch {
        /* poll hatasi yok say, bir sonraki denemede tekrar */
      }
    }, 2000);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="CANLI DEMO"
        title="qimlik OTP'yi kendiniz deneyin"
        subtitle="SMS gideri olmadan doğrulama nasıl çalışıyor, birebir görün. Aşağıdan doğrulamayı başlatın, telefonunuzdan tek bir mesaj gönderin; kimliğiniz saniyeler içinde bu ekranda doğrulansın."
        accent="#0ea5e9"
      />

      <section style={{ padding: '3rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="glass-card" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-light)' }}>

            {/* Adim gostergesi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <StepDot active={phase !== 'idle'} label="1. Başlat" />
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              <StepDot active={phase === 'waiting'} label="2. Mesaj gönder" />
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              <StepDot active={phase === 'success'} label="3. Doğrulandı" />
            </div>

            {phase === 'idle' && (
              <div style={{ textAlign: 'center' }}>
                <div className="feature-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', margin: '0 auto 1.25rem' }}>
                  <ShieldCheck size={28} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Doğrulamayı başlatın</h2>
                <p className="text-muted" style={{ fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Butona bastığınızda size özel bir kod üretilir. O kodu WhatsApp veya SMS ile
                  gönderdiğinizde, doğrulamanın anlık gerçekleştiğini bu ekranda göreceksiniz.
                </p>
                <button onClick={start} className="btn btn-primary" style={{ padding: '0.9rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={18} /> Doğrulamayı Başlat
                </button>
              </div>
            )}

            {phase === 'waiting' && (
              <div>
                <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                  Aşağıdaki <strong style={{ color: 'var(--text-primary)' }}>hazır mesajı</strong> değiştirmeden gönderin.
                  Numara kaydetmenize gerek yok — butonlar mesajı otomatik hazırlar.
                </p>

                {/* Mesaj kutusu */}
                <div style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border-light)', borderRadius: 12, padding: '1.1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>Gönderilecek mesaj</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif' }}>{message}</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>Alıcı: {GATEWAY_PHONE_DISPLAY}</div>
                </div>

                {/* Iki buton */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  <a href={waLink} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', background: '#25d366', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,211,102,0.25)' }}>
                    <MessageSquare size={18} /> WhatsApp ile
                  </a>
                  <a href={smsLink}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', background: '#0ea5e9', color: '#fff', borderRadius: 10, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(14,165,233,0.25)' }}>
                    <Smartphone size={18} /> SMS ile
                  </a>
                </div>

                {/* QR — bilgisayardan bakan musteri telefonuyla okusun */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                    Bilgisayardan mı bakıyorsunuz? Telefon kameranızla QR'ı okutun:
                  </div>
                  <img src={qrUrl} alt="WhatsApp QR" width={160} height={160}
                    style={{ borderRadius: 12, border: '1px solid var(--border-light)', background: '#fff', padding: 6 }} />
                </div>

                {/* Sayac + bekleme */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(14,165,233,0.08)', color: '#0369a1', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  <RefreshCw size={16} style={{ animation: 'qspin 1s linear infinite' }} />
                  Doğrulama bekleniyor… ({formatTime(timeLeft)})
                </div>
                <style>{`@keyframes qspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {phase === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', color: '#059669' }}>Doğrulandı! 🎉</h2>
                <p className="text-muted" style={{ fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Gönderdiğiniz mesaj saniyeler içinde yakalandı ve kimliğiniz doğrulandı —
                  hiçbir SMS ücreti ödemeden. İşletmenizde de tam olarak böyle çalışır.
                </p>
                <button onClick={start} className="btn btn-outline" style={{ padding: '0.8rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={16} /> Tekrar Dene
                </button>
              </div>
            )}

            {phase === 'expired' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Clock size={34} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#b45309' }}>Süre doldu</h2>
                <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Bu deneme kodunun 3 dakikalık süresi doldu. Yeni bir kodla tekrar deneyebilirsiniz.
                </p>
                <button onClick={start} className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={16} /> Yeni Kod Üret
                </button>
              </div>
            )}
          </div>

          <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1.25rem', lineHeight: 1.5 }}>
            Bu bir canlı demodur; gerçek doğrulama altyapısı üzerinde çalışır. Gönderdiğiniz mesaj
            yalnızca demo amaçlı işlenir, saklanmaz.
          </p>
        </div>
      </section>
    </div>
  );
}

function StepDot({ active, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: active ? '#0ea5e9' : 'var(--text-muted)' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: active ? '#0ea5e9' : 'var(--border-light)', display: 'inline-block' }} />
      {label}
    </div>
  );
}
