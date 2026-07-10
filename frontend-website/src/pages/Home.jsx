import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Smartphone,
  Zap,
  QrCode,
  Lock,
  Globe,
  ExternalLink,
  User,
  Wrench,
  Clock,
  Truck,
  MapPin,
  Signature,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';
import HeroArt from '../components/HeroArt';
import HowItWorks from '../components/HowItWorks';
import ProductMock from '../components/ProductMock';

export default function Home() {
  // Urun panellerine git butonlari icin adres yardimcisi (uretimde subdomain).
  const getAppUrl = (port, subdomain) => {
    return window.location.hostname.endsWith('qimlik.com')
      ? `https://${subdomain}.qimlik.com`
      : `http://${window.location.hostname}:${port}`;
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Hero Section */}
      <section className="hero" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem 0 6rem 0' }}>
        <div className="container hero-grid">
          <div className="hero-content">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
              <Zap size={14} /> HEPSİ BİR ARADA SAAS EKOSİSTEMİ
            </div>
            <h1 className="gradient-text" style={{ fontSize: '3.8rem', lineHeight: '1.15', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Saha, Güvenlik ve Maliyet Kontrolü.
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Operatör SMS giderlerini sıfırlayan reverse-OTP doğrulama altyapısı, akıllı QR kodlu makine bakımı, konum doğrulamalı saha mesai takibi ve dijital imzalı teslimat kanıtı. Hepsi tek bir platformda: <strong>qimlik</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/kayit" className="btn btn-primary" style={{ padding: '0.9rem 1.8rem', textDecoration: 'none' }}>Ücretsiz Başla</Link>
              <Link to="/giris" className="btn btn-outline" style={{ padding: '0.9rem 1.8rem', textDecoration: 'none' }}>Panele Giriş</Link>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <HeroArt style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* SaaS Solutions Grid Overview */}
      <section id="cozumler" style={{ padding: '6rem 0', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>B2B İşletme Çözümlerimiz</h2>
            <p className="text-muted" style={{ fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto' }}>
              Şirketinizin operasyonel süreçlerini hızlandıran, sahadaki personelinizi anlık yöneten ve maliyetlerinizi düşüren dijital çözümler.
            </p>
          </div>
          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

            {/* OTP CARD */}
            <div className="feature-card glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div className="feature-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                  <ShieldCheck size={28} />
                </div>
                <h3>qimlik OTP</h3>
                <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Geleneksel pahalı SMS onay kodlarına veda edin. Reverse-OTP mimarisiyle kullanıcılarınız WhatsApp üzerinden kendilerini doğrulasın, SMS maliyetleriniz sıfırlansın.
                </p>
              </div>
              <Link to="/urunler/otp" className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', textDecoration: 'none' }}>Detayları İncele</Link>
            </div>

            {/* DIJITAL CARD */}
            <div className="feature-card glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <Wrench size={28} />
                </div>
                <h3>qimlik Dijital</h3>
                <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Akıllı QR kod destekli makine bakım takip paneli. Dinamik form tasarımları, arıza kaydı yönetimi, teknisyen atamaları ve geriye dönük detaylı personel çalışma raporları.
                </p>
              </div>
              <Link to="/urunler/dijital" className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', textDecoration: 'none' }}>Detayları İncele</Link>
            </div>

            {/* MESAI CARD */}
            <div className="feature-card glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Clock size={28} />
                </div>
                <h3>qimlik Mesai</h3>
                <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Konum doğrulamalı personel giriş-çıkış takibi. Her işlem, tanımlı şantiye alanına olan mesafesiyle kaydedilir; sınır dışı girişler işaretlenerek mesai güvenle raporlanır.
                </p>
              </div>
              <Link to="/urunler/mesai" className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', textDecoration: 'none' }}>Detayları İncele</Link>
            </div>

            {/* TESLIMAT CARD */}
            <div className="feature-card glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div className="feature-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Truck size={28} />
                </div>
                <h3>qimlik Teslimat</h3>
                <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  Kurye zimmet atamaları, alıcı WhatsApp reverse-OTP doğrulaması ve teslimat anında ekran üstü parmakla dijital imza altyapısı ile dijital teslimat kanıtı.
                </p>
              </div>
              <Link to="/urunler/teslimat" className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', textDecoration: 'none' }}>Detayları İncele</Link>
            </div>

          </div>
        </div>
      </section>

      <HowItWorks />

      {/* SHOWCASE SECTION 1: qimlik OTP */}
      <section id="cozum-otp" className="product-showcase">
        <div className="container hero-grid">
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: 600, marginBottom: '1rem' }}>
              <ShieldCheck size={20} /> DOĞRULAMA ALTYAPISI
            </div>
            <h2 className="product-showcase-title">qimlik OTP</h2>
            <p className="product-showcase-desc">
              Sıfır maliyetle kullanıcı doğrulaması yapın. Doğrulama kodunu siz göndermek yerine, kullanıcıya ekrandan veya mobil link üzerinden WhatsApp ile kod attırın.
            </p>
            <ul className="product-showcase-list">
              <li>
                <Zap size={18} color="#0ea5e9" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>SMS Faturalarını Sıfırlayın:</strong> Kullanıcılar kodu kendileri gönderdiği için operatör SMS giderleriniz tamamen sıfırlanır.</span>
              </li>
              <li>
                <Lock size={18} color="#0ea5e9" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Tek Kullanımlık Güvenli Kod:</strong> Her doğrulama kodu sunucuda üretilir, 5 dakika geçerlidir ve yalnızca bir kez kullanılabilir.</span>
              </li>
              <li>
                <Globe size={18} color="#0ea5e9" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Webhook Bildirimi:</strong> Gelen onaylar sisteminize anında güvenli bir webhook aracılığıyla iletilir.</span>
              </li>
            </ul>
            <a href={getAppUrl(5002, 'panel')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              OTP Yönetim Paneline Git <ExternalLink size={16} />
            </a>
          </div>
          <div className="hero-image glass-card" style={{ padding: '1rem', border: '1px solid rgba(14, 165, 233, 0.15)' }}>
            <ProductMock type="otp" />
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 2: qimlik Dijital */}
      <section id="cozum-dijital" className="product-showcase" style={{ background: 'var(--bg-alt)' }}>
        <div className="container hero-grid">
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontWeight: 600, marginBottom: '1rem' }}>
              <Wrench size={20} /> AKILLI MAKİNE BAKIM
            </div>
            <h2 className="product-showcase-title">qimlik Dijital</h2>
            <p className="product-showcase-desc">
              Makinelerinizin bakım süreçlerini dijitalleştirin. Teknik arızaları anında kaydedin, yetkili teknisyenleri atayın ve makinelerin çalışma durumlarını canlı takip edin.
            </p>
            <ul className="product-showcase-list">
              <li>
                <ClipboardList size={18} color="#6366f1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Dinamik Kategori & Form Tasarımı:</strong> Her makine kategorisine özel, teknisyenlerin dolduracağı özel form alanları oluşturun.</span>
              </li>
              <li>
                <User size={18} color="#6366f1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Teknisyen Raporlaması:</strong> Personeli seçerek hangi gün kaç saat çalıştığını, hangi makineyle ilgilendiğini geriye dönük raporlayın.</span>
              </li>
              <li>
                <QrCode size={18} color="#6366f1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>QR Kodlu Etiketler:</strong> Her makineye özel üretilen QR kodlar sayesinde teknisyenler sahada kodu okutarak anında forma erişir.</span>
              </li>
            </ul>
            <a href={getAppUrl(5004, 'dijital')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)' }}>
              Dijital Paneline Git <ExternalLink size={16} />
            </a>
          </div>
          <div className="hero-image glass-card" style={{ padding: '1rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <ProductMock type="dijital" />
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 3: qimlik Mesai */}
      <section id="cozum-mesai" className="product-showcase">
        <div className="container hero-grid">
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, marginBottom: '1rem' }}>
              <MapPin size={20} /> SAHA MESAI TAKIBI
            </div>
            <h2 className="product-showcase-title">qimlik Mesai</h2>
            <p className="product-showcase-desc">
              Personelinizin mesai başlangıç ve bitişlerini konum doğrulamalı olarak yönetin. Her giriş-çıkış, tanımlı şantiye alanına olan mesafesiyle birlikte kaydedilir; sınır dışından yapılan işlemler otomatik işaretlenir.
            </p>
            <ul className="product-showcase-list">
              <li>
                <MapPin size={18} color="#10b981" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Konum Doğrulamalı Kayıt:</strong> Her giriş-çıkış, tanımladığınız şantiye koordinatına olan mesafesiyle birlikte kaydedilir.</span>
              </li>
              <li>
                <Lock size={18} color="#10b981" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Sınır Dışı Uyarısı:</strong> Tanımlı alan dışından yapılan girişler "şantiye dışında" olarak işaretlenir ve sapma mesafesi rapora yansır.</span>
              </li>
              <li>
                <Clock size={18} color="#10b981" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Çalışma Saat Raporları:</strong> Personel bazlı geriye dönük günlük/aylık toplam çalışma saatlerini anlık rapor halinde alın.</span>
              </li>
            </ul>
            <a href={getAppUrl(5005, 'mesai')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)' }}>
              Mesai Paneline Git <ExternalLink size={16} />
            </a>
          </div>
          <div className="hero-image glass-card" style={{ padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <ProductMock type="mesai" />
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 4: qimlik Teslimat */}
      <section id="cozum-teslimat" className="product-showcase" style={{ background: 'var(--bg-alt)' }}>
        <div className="container hero-grid">
          <div className="hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 600, marginBottom: '1rem' }}>
              <Truck size={20} /> LOJISTIK & TESLIMAT KANITI
            </div>
            <h2 className="product-showcase-title">qimlik Teslimat</h2>
            <p className="product-showcase-desc">
              Lojistik ve kurye dağıtımlarınız için güvenli teslimat kanıtı. Alıcıya atılan WhatsApp reverse-OTP ve ekran üstü imza alanı ile temassız, dijital arşivlenebilir teslimat akışı.
            </p>
            <ul className="product-showcase-list">
              <li>
                <Smartphone size={18} color="#f59e0b" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Kurye WhatsApp Girişi:</strong> Kuryeleriniz şifresiz, sadece kendi telefonlarından atacakları tek bir WhatsApp mesajıyla sisteme girer.</span>
              </li>
              <li>
                <Signature size={18} color="#f59e0b" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Ekran Üstü Parmakla İmza:</strong> Teslimat anında alıcı kuryenin ekranına parmağıyla imza atar. İmza görseli yüksek oranda sıkıştırılarak sunucuda saklanır.</span>
              </li>
              <li>
                <CheckSquare size={18} color="#f59e0b" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Konum ve Saat Loglama:</strong> Teslimatın yapıldığı tam GPS koordinatı ve saat verisi değiştirilemez şekilde kayıt altına alınır.</span>
              </li>
            </ul>
            <a href={getAppUrl(5006, 'teslimat')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)' }}>
              Teslimat Paneline Git <ExternalLink size={16} />
            </a>
          </div>
          <div className="hero-image glass-card" style={{ padding: '1rem', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <ProductMock type="teslimat" />
          </div>
        </div>
      </section>

      {/* CTA BANDI */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-color)' }}>
        <div className="container">
          <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center', padding: '3.5rem 2rem', borderRadius: 28, background: 'var(--brand-gradient)', boxShadow: '0 25px 50px -12px rgba(99,102,241,0.35)' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'white', marginBottom: '1rem' }}>Bugün başlayın, maliyeti bugün düşürün</h2>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.9)', maxWidth: 580, margin: '0 auto 2rem' }}>
              Dakikalar içinde hesabınızı oluşturun. Kullanmak istediğiniz modülü seçin, hemen deneyin.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/kayit" className="btn" style={{ background: 'white', color: 'var(--brand-secondary)', padding: '0.9rem 2rem', textDecoration: 'none' }}>Ücretsiz Kaydol</Link>
              <Link to="/giris" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.45)', padding: '0.9rem 2rem', textDecoration: 'none' }}>Panele Giriş</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
