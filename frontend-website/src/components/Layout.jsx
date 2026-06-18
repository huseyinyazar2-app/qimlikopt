import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="brand-logo">
            <ShieldCheck color="var(--brand-primary)" size={28} />
            Qimlik
          </Link>
          <div className="nav-links">
            <a href="#ozellikler" className="nav-link">Özellikler</a>
            <a href="#qr-kod" className="nav-link">Nasıl Çalışır?</a>
            <a href="#fiyatlandirma" className="nav-link">Fiyatlandırma</a>
            <a href="http://localhost:3303" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>Müşteri Girişi</a>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>Demo Talep Et</button>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '60px' }}>
        <Outlet />
      </main>

      <footer>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4rem' }}>
          <div>
            <Link to="/" className="brand-logo" style={{ color: 'white', marginBottom: '1rem' }}>
              <ShieldCheck color="var(--brand-primary)" size={28} />
              Qimlik
            </Link>
            <p>B2B şirketler için sıfır maliyetli, yüksek güvenlikli Reverse OTP doğrulama altyapısı.</p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Ürün</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Özellikler</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Entegrasyon</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Güvenlik</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>İletişim</h4>
            <p>hello@qimlik.com</p>
            <p>İstanbul, Türkiye</p>
          </div>
        </div>
        <div className="container" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} Qimlik. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  );
}
