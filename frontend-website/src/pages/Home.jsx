import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  QrCode, 
  Lock, 
  Globe, 
  Building2, 
  CheckCircle, 
  ExternalLink, 
  Phone, 
  User, 
  Wrench, 
  Clock, 
  Truck, 
  MapPin, 
  Signature, 
  ClipboardList, 
  CheckSquare 
} from 'lucide-react';
import { getApiUrl } from '../config';

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSurname, setContactSurname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Subdomain / Port mapping helper
  const getAppUrl = (port, subdomain) => {
    return window.location.hostname.endsWith('qimlik.com')
      ? `https://${subdomain}.qimlik.com`
      : `http://${window.location.hostname}:${port}`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${getApiUrl()}/api/client/register`, {
        company_name: companyName,
        password: password,
        phone_number: phoneNumber,
        contact_name: contactName,
        contact_surname: contactSurname
      });
      setSuccessData(res.data.client);
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
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
              operatör SMS giderlerini sıfırlayan Reverse OTP doğrulama altyapısı, akıllı QR kodlu makine bakımı, konum doğrulamalı saha mesai takibi ve dijital imzalı teslimat kanıtı. Hepsi tek bir platformda: <strong>qimlik</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="#cozumler" className="btn btn-primary" style={{ padding: '0.9rem 1.8rem', textDecoration: 'none' }}>Çözümleri İncele</a>
              <a href="#giris" className="btn btn-outline" style={{ padding: '0.9rem 1.8rem', textDecoration: 'none' }}>Giriş Panelleri</a>
            </div>
          </div>
          <div className="hero-image" style={{ background: 'rgba(15, 23, 42, 0.01)', padding: '0.5rem', borderRadius: '32px', border: '1px solid rgba(15, 23, 42, 0.04)', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.1)' }}>
            <img src="/hero.png" alt="qimlik B2B SaaS Ecosystem" style={{ borderRadius: '26px', width: '100%', display: 'block' }} />
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
                  Geleneksel pahalı SMS onay kodlarına veda edin. Reverse OTP mimarisiyle kullanıcılarınız WhatsApp üzerinden kendilerini doğrulasın, SMS maliyetleriniz sıfırlansın.
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
                  Konum doğrulamalı saha sınır uyumlu, sahte GPS (Fake GPS) korumalı personel giriş-çıkış takibi. Şantiye veya ofis sınırlarına giren personelin mesaisini güvenle loglayın.
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
                  Kurye zimmet atamaları, alıcı WhatsApp Reverse OTP doğrulaması ve teslimat anında ekran üstü parmakla dijital imza altyapısı ile dijital teslimat kanıtı.
                </p>
              </div>
              <Link to="/urunler/teslimat" className="btn btn-outline" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', textDecoration: 'none' }}>Detayları İncele</Link>
            </div>

          </div>
        </div>
      </section>

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
                <span><strong>SIM Klonlama Koruması:</strong> SIM swapping ve oltalama (Phishing) saldırılarına karşı üst düzey koruma sağlar.</span>
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
            <img src="/qr.png" alt="qimlik OTP Doğrulama Ekranı" style={{ borderRadius: '16px', width: '100%', display: 'block' }} />
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
            <img src="/dijital.png" alt="qimlik Dijital Makine Bakım Arayüzü" style={{ borderRadius: '16px', width: '100%', display: 'block' }} />
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
              Personelinizin mesai başlangıç ve bitişlerini güvenli konum doğrulamalı teknolojiyle yönetin. GPS doğrulaması sayesinde saha dışında giriş yapılmasını engelleyin.
            </p>
            <ul className="product-showcase-list">
              <li>
                <MapPin size={18} color="#10b981" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Konum Doğrulamalı Sınırlar:</strong> Personel sadece sizin belirlediğiniz koordinat alanı içerisindeyken giriş-çıkış yapabilir.</span>
              </li>
              <li>
                <Lock size={18} color="#10b981" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span><strong>Sahte GPS (Fake GPS) Koruması:</strong> Üçüncü parti konum değiştirici uygulamaların kullanılmasını algılar ve engeller.</span>
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
            <img src="/mesai.png" alt="qimlik Mesai Saha Takip Arayüzü" style={{ borderRadius: '16px', width: '100%', display: 'block' }} />
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
              Lojistik ve kurye dağıtımlarınız için güvenli teslimat kanıtı. Alıcıya atılan WhatsApp Reverse OTP ve ekran üstü imza alanı ile temassız, dijital arşivlenebilir teslimat akışı.
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
            <img src="/teslimat.png" alt="qimlik Teslimat Kurye Arayüzü" style={{ borderRadius: '16px', width: '100%', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* CENTRAL GATEWAY LOGIN SECTION */}
      <section id="giris" style={{ padding: '6rem 0', background: 'var(--bg-color)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Müşteri & Personel Giriş Kapısı</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
              qimlik SaaS ekosistemindeki yetkili panellerinize aşağıdaki kısayollardan doğrudan erişebilirsiniz.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(14, 165, 233, 0.15)' }}>
              <div>
                <ShieldCheck size={36} color="#0ea5e9" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>OTP API Paneli</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Doğrulama ayarları, API anahtarları ve Webhook entegrasyonu.</p>
              </div>
              <a href={getAppUrl(5002, 'panel')} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                Yönetime Giriş <ExternalLink size={14} />
              </a>
            </div>

            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <div>
                <Wrench size={36} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Dijital Makine Paneli</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Makine envanteri, arıza kayıtları ve personel çalışma raporları.</p>
              </div>
              <a href={getAppUrl(5004, 'dijital')} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                Yönetime Giriş <ExternalLink size={14} />
              </a>
            </div>

            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div>
                <Clock size={36} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Mesai Saha Paneli</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Konum doğrulamalı koordinat ayarları, sahte GPS logları ve mesai raporları.</p>
              </div>
              <a href={getAppUrl(5005, 'mesai')} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                Yönetime Giriş <ExternalLink size={14} />
              </a>
            </div>

            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div>
                <Truck size={36} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Teslimat Lojistik Paneli</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Kurye takibi, zimmet atama, teslim edilen imzalı paket arşivleri.</p>
              </div>
              <a href={getAppUrl(5006, 'teslimat')} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                Yönetime Giriş <ExternalLink size={14} />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* REGISTRATION SECTION */}
      <section id="kayit" style={{ padding: '6rem 0', background: 'var(--bg-alt)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }} className="gradient-text">Hemen Hesabınızı Oluşturun</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 500, margin: '0 auto' }}>
              qimlik sistemine kaydolun ve işletme maliyetlerinizi sıfırlamaya bugün başlayın.
            </p>
          </div>

          {!successData ? (
            <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem' }}>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Şirket Adı</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        required 
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Örn: Aktaş Holding"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Firma Telefonu</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        required 
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="Örn: +90 212 555 55 55"
                        className="glass-input"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Yetkili Adı</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        required 
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="Örn: Ahmet"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Yetkili Soyadı</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        required 
                        value={contactSurname}
                        onChange={e => setContactSurname(e.target.value)}
                        placeholder="Örn: Yılmaz"
                        className="glass-input"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>Şifre</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Giriş şifrenizi belirleyin"
                      className="glass-input"
                    />
                  </div>
                </div>

                <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '1.2rem', margin: '0 0 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Kayıt sonrası sistem şirket adınıza göre otomatik olarak bir Firma Ön Eki (Prefix) atayacaktır.</li>
                  <li>Sistemi anında test edebilmeniz için firmanıza özel bir Web Servis API Adresi (Webhook) otomatik tanımlanacaktır.</li>
                </ul>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', width: '100%' }}>
                  {loading ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Kaydol'}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ maxWidth: 550, margin: '0 auto', padding: '2.5rem', border: '1px solid var(--status-success)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <CheckCircle size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Hesabınız Başarıyla Oluşturuldu!</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Aşağıdaki bilgilerle müşteri paneline giriş yapabilirsiniz.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', background: 'rgba(15, 23, 42, 0.03)', borderRadius: 12, marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">Şirket Adı</span>
                  <span style={{ fontWeight: 600 }}>{successData.company_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">Yetkili</span>
                  <span style={{ fontWeight: 600 }}>{successData.contact_name} {successData.contact_surname}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">Firma Ön Eki (Prefix)</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: '1.1rem' }}>{successData.prefix}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '0.75rem' }}>
                  <span className="text-muted">Şifreniz</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{successData.api_key}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Size Özel Web Servis API (Webhook) URL</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.05)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: 6, wordBreak: 'break-all', fontFamily: 'monospace' }}>{successData.webhook_url}</span>
                </div>
              </div>

              <a 
                href={getAppUrl(5002, 'panel')} 
                className="btn btn-primary" 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.9rem', boxSizing: 'border-box' }}
              >
                Müşteri Paneline Git ve Giriş Yap <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
