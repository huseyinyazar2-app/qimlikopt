import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck, MapPin, Truck, QrCode, Building2, Phone, User, Lock,
  ArrowLeft, ArrowRight, CheckCircle, ExternalLink,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { getApiUrl, getPanelUrl } from '../config';

const ICONS = { ShieldCheck, MapPin, Truck, QrCode };

export default function Register() {
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ company_name: '', phone_number: '', contact_name: '', contact_surname: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const endpointFor = (p) => (p.slug === 'otp' ? '/api/client/register' : `/api/${p.slug}/company/register`);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const reset = () => { setProduct(null); setResult(null); setError(''); setForm({ company_name: '', phone_number: '', contact_name: '', contact_surname: '', password: '' }); };

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
                <Field icon={Phone} label="Firma Telefonu" value={form.phone_number} onChange={set('phone_number')} placeholder="+90 5xx xxx xx xx" />
                <Field icon={Lock} label="Şifre" type="password" value={form.password} onChange={set('password')} placeholder="Giriş şifrenizi belirleyin" />
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.4rem', padding: '0.9rem', width: '100%', background: product.color }}>
                  {loading ? 'Hesap oluşturuluyor...' : 'Ücretsiz kaydol'}
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
