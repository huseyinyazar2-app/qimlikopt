import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Truck, QrCode, ExternalLink, ArrowRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { getPanelUrl } from '../config';

const ICONS = { ShieldCheck, MapPin, Truck, QrCode };

export default function Login() {
  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <section style={{ padding: '5rem 0 4rem', background: 'radial-gradient(circle at top, rgba(99,102,241,0.06), transparent 55%)' }}>
        <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              PANELE GİRİŞ
            </div>
            <h1 className="gradient-text" style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>Hangi panele giriş yapacaksınız?</h1>
            <p className="text-muted" style={{ fontSize: '1.12rem', maxWidth: 600, margin: '0 auto' }}>
              qimlik ekosisteminde her modülün kendi paneli vardır. Kullandığınız modülü seçin; şirket telefonu ve şifrenizle o panelden giriş yaparsınız.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
            {PRODUCTS.map((p) => {
              const Icon = ICONS[p.icon] || ShieldCheck;
              return (
                <a
                  key={p.slug}
                  href={getPanelUrl(p.subdomain, p.port)}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-card"
                  style={{ padding: '2rem', textAlign: 'left', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: `3px solid ${p.color}` }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${p.color}1f`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} />
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>{p.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.85rem', flex: 1 }}>{p.audience}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.color, fontWeight: 600, fontSize: '0.9rem' }}>
                    Giriş yap <ExternalLink size={15} />
                  </div>
                </a>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-alt)', borderRadius: 16, border: '1px solid var(--border-light)' }}>
            <span className="text-muted" style={{ fontSize: '1rem' }}>Henüz hesabınız yok mu? </span>
            <Link to="/kayit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand-secondary)', fontWeight: 700, textDecoration: 'none' }}>
              Ücretsiz kaydolun <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
