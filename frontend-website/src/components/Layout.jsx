import { Outlet, Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { ShieldCheck, ChevronDown, Menu, X } from 'lucide-react';
import { PRODUCTS } from '../data/products';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="brand-logo" onClick={close} style={{ display: 'flex', alignItems: 'center' }}>
            <ShieldCheck color="var(--brand-primary)" size={28} />
            qimlik
          </Link>

          <div className="nav-links">
            <div className="nav-dropdown">
              <span className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                Çözümler <ChevronDown size={15} />
              </span>
              <div className="nav-dropdown-menu">
                {PRODUCTS.map((p) => (
                  <Link key={p.slug} to={`/urunler/${p.slug}`} className="nav-dropdown-item">
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.tagline}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/fiyatlandirma" className="nav-link">Fiyatlandırma</NavLink>
            <NavLink to="/hakkimizda" className="nav-link">Hakkımızda</NavLink>
            <NavLink to="/iletisim" className="nav-link">İletişim</NavLink>
            <Link to="/#giris" className="nav-link">Giriş Yap</Link>
            <Link to="/#kayit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', textDecoration: 'none' }}>Hemen Başla</Link>
          </div>

          <button className="nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menü">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="nav-mobile-menu">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 0' }}>Çözümler</div>
            {PRODUCTS.map((p) => (
              <Link key={p.slug} to={`/urunler/${p.slug}`} className="nav-mobile-link" onClick={close}>{p.name}</Link>
            ))}
            <div style={{ height: 1, background: 'var(--border-light)', margin: '0.5rem 0' }} />
            <Link to="/fiyatlandirma" className="nav-mobile-link" onClick={close}>Fiyatlandırma</Link>
            <Link to="/hakkimizda" className="nav-mobile-link" onClick={close}>Hakkımızda</Link>
            <Link to="/iletisim" className="nav-mobile-link" onClick={close}>İletişim</Link>
            <Link to="/#giris" className="nav-mobile-link" onClick={close}>Giriş Yap</Link>
            <Link to="/#kayit" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: '0.5rem' }} onClick={close}>Hemen Başla</Link>
          </div>
        )}
      </nav>

      <main style={{ paddingTop: '60px' }}>
        <Outlet />
      </main>

      <footer>
        <div className="container footer-grid">
          <div>
            <Link to="/" className="brand-logo" style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <ShieldCheck color="var(--brand-primary)" size={28} />
              qimlik
            </Link>
            <p style={{ maxWidth: 300 }}>Saha operasyonları, mesai takibi, lojistik teslimatları ve OTP doğrulama için tek platform.</p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Çözümler</h4>
            <div className="footer-links">
              {PRODUCTS.map((p) => (
                <Link key={p.slug} to={`/urunler/${p.slug}`}>{p.name}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Kurumsal</h4>
            <div className="footer-links">
              <Link to="/hakkimizda">Hakkımızda</Link>
              <Link to="/fiyatlandirma">Fiyatlandırma</Link>
              <Link to="/iletisim">İletişim</Link>
              <Link to="/sss">Sıkça Sorulan Sorular</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Yasal</h4>
            <div className="footer-links">
              <Link to="/kvkk">KVKK Aydınlatma Metni</Link>
              <Link to="/gizlilik">Gizlilik Politikası</Link>
              <Link to="/kullanim-sartlari">Kullanım Şartları</Link>
            </div>
          </div>
        </div>
        <div className="container" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p>&copy; {new Date().getFullYear()} qimlik. Tüm hakları saklıdır.</p>
          <p>hello@qimlik.com · İstanbul, Türkiye</p>
        </div>
      </footer>
    </>
  );
}
