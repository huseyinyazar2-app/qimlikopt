import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck, MapPin, Truck, QrCode, Building2, Phone, User, Lock,
  ArrowLeft, ArrowRight, CheckCircle, ExternalLink, MessageSquare, Smartphone, Clock,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { getApiUrl, getPanelUrl, GATEWAY_PHONE } from '../config';

const ICONS = { ShieldCheck, MapPin, Truck, QrCode };

// qimlik'in kendi kaydında telefon doğrulaması (dogfooding): sunucu kod üretir
// (signup-otp/start), kullanıcı "QMLK <kod>"u gateway'e gönderir, signup-otp/verify
// ile telefon-sahipliği doğrulanır (telefon zorunlu, tek kullanımlık).
const SIGNUP_PREFIX = 'QMLK';

export default function Register() {
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ company_name: '', phone_number: '', contact_name: '', contact_surname: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Telefon değişirse doğrulama sıfırlanır (başka numarayı doğrulanmış saymayalım).
  const setPhone = (e) => { setForm((f) => ({ ...f, phone_number: e.target.value })); setPhoneVerified(false); };

  const endpointFor = (p) => (p.slug === 'otp' ? '/api/client/register' : `/api/${p.slug}/company/register`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified) {
      setError('Devam etmek için lütfen telefon numaranızı doğrulayın.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${getApiUrl()}${endpointFor(product)}`, form);
      setResult(product.slug === 'otp' ? { kind: 'otp', data: res.data.client } : { kind: 'company', data: res.data.company });
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setProduct(null); setResult(null); setError(''); setPhoneVerified(false); setForm({ company_name: '', phone_number: '', contact_name: '', contact_surname: '', password: '' }); };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <section style={{ padding: '5rem 0 4rem', background: 'radial-gradient(circle at top, rgba(14,165,233,0.06), transparent 55%)' }}>
        <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Basari */}
          {result ? (
            <SuccessCard product={product} result={result} onReset={reset} />
          ) : !product ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'inline-flex', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>ÜCRETSİZ KAYIT</div>
                <h1 className="gradient-text" style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>Hangi çözümle başlıyorsunuz?</h1>
                <p className="text-muted" style={{ fontSize: '1.12rem', maxWidth: 560, margin: '0 auto' }}>
                  Kullanmak istediğiniz modülü seçin. Dilediğiniz zaman diğer modüllere de ayrıca kaydolabilirsiniz.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
                {PRODUCTS.map((p) => {
                  const Icon = ICONS[p.icon] || ShieldCheck;
                  return (
                    <button key={p.slug} onClick={() => setProduct(p)} className="glass-card" style={{ padding: '1.75rem', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: `3px solid ${p.color}`, background: 'var(--glass-bg)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}1f`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} />
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{p.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem', flex: 1 }}>{p.tagline}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.color, fontWeight: 600, fontSize: '0.9rem' }}>Bununla başla <ArrowRight size={15} /></div>
                    </button>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <span className="text-muted">Zaten hesabınız var mı? </span>
                <Link to="/giris" style={{ color: 'var(--brand-secondary)', fontWeight: 700, textDecoration: 'none' }}>Giriş yapın</Link>
              </div>
            </>
          ) : (
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <button onClick={() => { setProduct(null); setError(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <ArrowLeft size={16} /> Modül seçimine dön
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${product.color}1f`, color: product.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => { const Icon = ICONS[product.icon] || ShieldCheck; return <Icon size={22} />; })()}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>{product.name} kaydı</h1>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>{product.tagline}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {error && <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
                <Field icon={Building2} label="Şirket Adı" value={form.company_name} onChange={set('company_name')} placeholder="Örn: Aktaş Holding" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <Field icon={User} label="Yetkili Adı" value={form.contact_name} onChange={set('contact_name')} placeholder="Ahmet" />
                  <Field icon={User} label="Yetkili Soyadı" value={form.contact_surname} onChange={set('contact_surname')} placeholder="Yılmaz" />
                </div>
                <PhoneVerifyField value={form.phone_number} onChange={setPhone} verified={phoneVerified} onVerified={() => setPhoneVerified(true)} accent={product.color} />
                <Field icon={Lock} label="Şifre" type="password" value={form.password} onChange={set('password')} placeholder="Giriş şifrenizi belirleyin" />
                <button type="submit" className="btn btn-primary" disabled={loading || !phoneVerified} style={{ marginTop: '0.4rem', padding: '0.9rem', width: '100%', background: product.color, opacity: (loading || !phoneVerified) ? 0.55 : 1, cursor: (loading || !phoneVerified) ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Hesap oluşturuluyor...' : phoneVerified ? 'Ücretsiz kaydol' : 'Önce telefonu doğrulayın'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type={type} required value={value} onChange={onChange} placeholder={placeholder} className="glass-input" />
      </div>
    </div>
  );
}

// Zorunlu telefon alanı + ters-OTP doğrulaması (qimlik'in kendi ürününü kullanması).
// "Doğrula" → kod üret → WhatsApp/SMS ile gönder → verify-status &phone= ile bağla.
function PhoneVerifyField({ value, onChange, verified, onVerified, accent }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | waiting | expired
  const [timeLeft, setTimeLeft] = useState(180);
  const [err, setErr] = useState('');
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const cleanPhone = (value || '').replace(/\D/g, '');
  const msg = `${SIGNUP_PREFIX} ${code}`;
  const waLink = `https://wa.me/${GATEWAY_PHONE}?text=${encodeURIComponent(msg)}`;
  const smsLink = `sms:+${GATEWAY_PHONE}?body=${encodeURIComponent(msg)}`;

  const stop = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null; timerRef.current = null;
  };
  useEffect(() => () => stop(), []);

  const start = async () => {
    setErr('');
    if (cleanPhone.length < 10) { setErr('Geçerli bir telefon numarası girin.'); return; }
    stop();
    // Kod SUNUCUDA (CSPRNG) üretilir, telefona bağlanır, tek kullanımlıktır.
    let c;
    try {
      const { data } = await axios.post(`${getApiUrl()}/api/client/signup-otp/start`, { phone: cleanPhone });
      c = data.code;
    } catch { setErr('Kod üretilemedi, lütfen tekrar deneyin.'); return; }
    setCode(c); setStatus('waiting'); setTimeLeft(180); setOpen(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { stop(); setStatus('expired'); return 0; } return p - 1; });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.post(`${getApiUrl()}/api/client/signup-otp/verify`, { phone: cleanPhone, code: c });
        if (data.verified) { stop(); setStatus('idle'); setOpen(false); onVerified(); }
      } catch { /* poll hatası yoksay */ }
    }, 2000);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
        Firma Telefonu <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="tel" required value={value} onChange={onChange} placeholder="+90 5xx xxx xx xx" className="glass-input" disabled={verified} />
        </div>
        {verified ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 1rem', borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: '#059669', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <CheckCircle size={16} /> Doğrulandı
          </div>
        ) : (
          <button type="button" onClick={start} style={{ padding: '0 1.1rem', borderRadius: 10, border: 'none', background: accent || '#0ea5e9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Doğrula
          </button>
        )}
      </div>
      {err && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{err}</div>}

      {open && !verified && (
        <div style={{ marginTop: '0.85rem', padding: '1.1rem', borderRadius: 12, background: 'rgba(15,23,42,0.03)', border: '1px dashed var(--glass-border)' }}>
          {status === 'expired' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#b45309', fontWeight: 600, marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> Süre doldu</div>
              <div><button type="button" onClick={start} style={{ background: 'none', border: 'none', color: accent || '#0ea5e9', fontWeight: 700, cursor: 'pointer' }}>Yeni kod üret</button></div>
            </div>
          ) : (
            <>
              <p className="text-muted" style={{ fontSize: '0.82rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                Aşağıdaki mesajı <strong>WhatsApp veya SMS</strong> ile gönderin; numaranız otomatik doğrulanır. Mesajı gönderen taraf siz olduğunuz için SMS gideri size yansımaz.
              </p>
              <div style={{ textAlign: 'center', background: '#fff', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.6rem', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.06em' }}>{msg}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <a href={waLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem', borderRadius: 8, background: '#25d366', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}><MessageSquare size={16} /> WhatsApp</a>
                <a href={smsLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem', borderRadius: 8, background: '#0ea5e9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}><Smartphone size={16} /> SMS</a>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#0369a1', fontWeight: 600 }}>Doğrulama bekleniyor… ({fmt(timeLeft)})</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessCard({ product, result, onReset }) {
  const panelUrl = getPanelUrl(product.subdomain, product.port);
  const isOtp = result.kind === 'otp';
  const d = result.data || {};
  return (
    <div className="glass-card" style={{ maxWidth: 560, margin: '0 auto', padding: '2.5rem', border: '1px solid var(--status-success)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <CheckCircle size={30} />
        </div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>Hesabınız oluşturuldu!</h2>
        <p className="text-muted" style={{ fontSize: '0.95rem', marginTop: '0.35rem' }}>
          {isOtp ? 'Aşağıdaki bilgilerle müşteri panelinize giriş yapabilirsiniz.' : `${product.name} panelinize firma telefonu ve şifrenizle giriş yapabilirsiniz.`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'rgba(15,23,42,0.03)', borderRadius: 12, marginBottom: '1.75rem', border: '1px solid var(--glass-border)' }}>
        <Row label="Şirket" value={d.company_name} />
        {isOtp ? (
          <>
            <Row label="Firma Ön Eki (Prefix)" value={d.prefix} mono accent={product.color} />
            <Row label="API Anahtarı / Şifre" value={d.api_key} mono />
            {d.webhook_url && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Size özel Webhook URL</span>
                <span style={{ fontSize: '0.78rem', background: 'rgba(15,23,42,0.05)', padding: '0.5rem', borderRadius: 6, wordBreak: 'break-all', fontFamily: 'monospace' }}>{d.webhook_url}</span>
              </div>
            )}
          </>
        ) : (
          <Row label="Yetkili" value={`${d.contact_name || ''} ${d.contact_surname || ''}`.trim()} />
        )}
      </div>

      <a href={panelUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', width: '100%', justifyContent: 'center', textDecoration: 'none', padding: '0.9rem', background: product.color }}>
        {product.name} paneline git <ExternalLink size={16} />
      </a>
      <button onClick={onReset} style={{ display: 'block', margin: '1rem auto 0', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>
        Başka bir modüle kaydol
      </button>
    </div>
  );
}

function Row({ label, value, mono, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '0.7rem' }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 700, fontFamily: mono ? 'monospace' : 'inherit', color: accent || 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
