import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <ShieldCheck color="var(--brand-primary)" size={28} />
            qimlik
            <span className="version-badge">v1.0.3</span>
          </Link>
          <div className="nav-links">
            <a href="#cozumler" className="nav-link">Çözümlerimiz</a>
            <a href="#ozellikler" className="nav-link">Neden qimlik?</a>
            <a href="#giris" className="nav-link">Giriş Yap</a>
            <a href="#kayit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hemen Kaydol</a>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '60px' }}>
        <Outlet />
      </main>

      <footer>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4rem' }}>
          <div>
            <Link to="/" className="brand-logo" style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <ShieldCheck color="var(--brand-primary)" size={28} />
              qimlik
              <span className="version-badge">v1.0.3</span>
            </Link>
            <p>Saha operasyonları, mesai takibi, lojistik teslimatları ve OTP doğrulama süreçleri için yeni nesil SaaS platformu.</p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Çözümler</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#cozum-otp" style={{ color: '#94a3b8', textDecoration: 'none' }}>qimlik OTP</a>
              <a href="#cozum-dijital" style={{ color: '#94a3b8', textDecoration: 'none' }}>qimlik Dijital</a>
              <a href="#cozum-mesai" style={{ color: '#94a3b8', textDecoration: 'none' }}>qimlik Mesai</a>
              <a href="#cozum-teslimat" style={{ color: '#94a3b8', textDecoration: 'none' }}>qimlik Teslimat</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>İletişim</h4>
            <p>hello@qimlik.com</p>
            <p>İstanbul, Türkiye</p>
          </div>
        </div>
        <div className="container" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} qimlik. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  );
}
