import { ShieldCheck, Smartphone, Zap, QrCode, Lock, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1 className="gradient-text">SMS Maliyetlerini Sıfırlayın. Güvenliği Katlayın.</h1>
            <p>Geleneksel ve pahalı SMS onay kodlarına veda edin. Qimlik'in "Reverse OTP" mimarisiyle kullanıcılarınızdan onay alın, faturalarınızı sıfırlayın.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary">Hemen Başlayın</button>
              <button className="btn btn-outline">Sistemi İncele</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/hero.png" alt="Qimlik B2B Security" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="gradient-text">Neden Qimlik?</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Büyük ölçekli işletmeler ve KOBİ'ler için tasarlandı. Daha güvenli, daha ucuz ve daha hızlı.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon"><Zap size={28} /></div>
              <h3>Sıfır SMS Faturası</h3>
              <p className="text-muted">Doğrulama kodlarını siz göndermeyin, kullanıcılar size göndersin. Operatör SMS maliyetlerinden %100 tasarruf edin.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Lock size={28} /></div>
              <h3>Banka Düzeyinde Güvenlik</h3>
              <p className="text-muted">SIM kopyalama (SIM Swapping) ve oltalama (Phishing) saldırılarına karşı geleneksel OTP'den çok daha güvenlidir.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Globe size={28} /></div>
              <h3>Kolay Webhook Entegrasyonu</h3>
              <p className="text-muted">Kendi altyapınıza saniyeler içinde entegre edin. Gelen doğrulamalar anında sisteminize Webhook ile iletilir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Section / QR Code */}
      <section id="qr-kod" className="split-section">
        <div className="container hero-grid">
          <div className="hero-image" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img src="/qr.png" alt="QR Code Scanning Feature" style={{ borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
          </div>
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em' }}>
              <QrCode size={20} /> YENİ NESİL DOĞRULAMA
            </div>
            <h2>QR Kod ile Tek Şıkta Onay</h2>
            <p style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
              Kullanıcılarınızı SMS yazmakla uğraştırmayın. Ekranda beliren dinamik QR kodu okutarak veya mobil cihazlarda doğrudan "Onayla" butonuna basarak WhatsApp/SMS uygulamasını otomatik açtırın.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <ShieldCheck color="var(--status-success)" style={{ marginTop: 2 }} />
                <div>
                  <strong>Sürtünmesiz Deneyim:</strong> Kullanıcı kodu manuel girmek zorunda kalmaz.
                </div>
              </li>
              <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Smartphone color="var(--brand-primary)" style={{ marginTop: 2 }} />
                <div>
                  <strong>Mobil Uyumlu:</strong> Deep-link altyapısıyla tek tıkta doğrulama akışı.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '6rem 0', textAlign: 'center', background: 'var(--bg-color)' }}>
        <div className="container">
          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Hemen Tasarruf Etmeye Başlayın</h2>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: 600, margin: '0 auto 2.5rem auto' }}>
            Qimlik altyapısını kullanan şirketler arasına katılın. Ücretsiz deneme veya demo için ekibimizle görüşün.
          </p>
          <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Bizimle İletişime Geçin</button>
        </div>
      </section>
    </div>
  );
}
