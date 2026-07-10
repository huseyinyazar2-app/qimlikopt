import { Link } from 'react-router-dom';
import {
  Layers,
  Wallet,
  ShieldCheck,
  Flag,
  Plug,
  Target,
  Eye,
  ArrowRight,
  Boxes,
  KeyRound,
  Lock,
} from 'lucide-react';
import PageHero from '../components/PageHero';

// NOT: Şirket künyesi alanları ([Şirket Ünvanı], [Kuruluş Yılı], [Adres])
// birer yer tutucudur. Resmi bilgiler netleştiğinde bu alanları doldurun.

const degerler = [
  {
    icon: Layers,
    color: '#0ea5e9',
    baslik: 'Tek Platform, Çoklu Çözüm',
    metin:
      'OTP doğrulama, saha mesai takibi, makine bakımı ve teslimat kanıtı; hepsi tek bir hesap ve tek bir yönetim mantığı altında. Ayrı ayrı yazılımlarla uğraşmadan tüm operasyonu tek yerden yönetin.',
  },
  {
    icon: Wallet,
    color: '#6366f1',
    baslik: 'Maliyet Odaklı Mimari',
    metin:
      'Ters-OTP (kullanıcının kodu kendisinin gönderdiği doğrulama yöntemi) sayesinde operatör SMS giderlerinizi tamamen ortadan kaldırın. Doğrulama başına ödenen ücretler geçmişte kalsın.',
  },
  {
    icon: ShieldCheck,
    color: '#10b981',
    baslik: 'Veri Güvenliği ve KVKK',
    metin:
      'Tüm veriler KVKK (Kişisel Verilerin Korunması Kanunu) ilkeleri gözetilerek işlenir. Yetkilendirme, kayıt tutma ve erişim kontrolü baştan itibaren tasarımın parçasıdır.',
  },
  {
    icon: Flag,
    color: '#f59e0b',
    baslik: "Türkiye'ye Özel, Yerli Çözüm",
    metin:
      "Türkiye'deki işletmelerin saha gerçeklerine göre geliştirildi. Yerli ekip, yerel mevzuata uyum ve Türkçe destek ile yanınızda.",
  },
  {
    icon: Plug,
    color: '#0ea5e9',
    baslik: 'Kolay Entegrasyon',
    metin:
      'Webhook (olayları anlık bildiren güvenli bağlantı) ve sade API yapısı ile mevcut sistemlerinize hızlıca bağlanır. Kurulum için uzun projelere ihtiyaç duymazsınız.',
  },
];

const metrikler = [
  { deger: '4', etiket: 'Entegre Modül' },
  { deger: 'Tek Kullanımlık', etiket: 'Güvenli OTP Kodu' },
  { deger: '%0', etiket: 'SMS Doğrulama Gideri' },
  { deger: '%100', etiket: 'KVKK Uyumlu Süreç' },
];

export default function About() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="HAKKIMIZDA"
        title="Saha operasyonlarını dijitalleştiriyoruz"
        subtitle="qimlik; işletmelerin saha, güvenlik, mesai ve lojistik süreçlerini tek platformda, düşük maliyetle ve KVKK uyumlu biçimde dijitalleştirmek için kuruldu."
      />

      {/* Misyon & Vizyon */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div className="feature-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <Target size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Misyonumuz</h2>
              <p className="text-muted" style={{ fontSize: '1.02rem', lineHeight: 1.7 }}>
                İşletmelerin sahadaki günlük operasyonlarını; personel mesaisi, makine bakımı, güvenli doğrulama ve
                teslimat kanıtı gibi süreçleri tek bir platformda birleştirmek. Amacımız, büyük yazılım bütçeleri
                gerektirmeden her ölçekten firmanın operasyonunu dijitalleştirebilmesini sağlamak.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem' }}>
              <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Eye size={28} />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Vizyonumuz</h2>
              <p className="text-muted" style={{ fontSize: '1.02rem', lineHeight: 1.7 }}>
                qimlik'in çıkış noktası basit bir sorudur: Doğrulama kodunu işletme ödeyerek göndermek zorunda mı?
                Ters-OTP fikriyle SMS maliyetini sıfıra indirdik. Vizyonumuz, bu maliyet odaklı ve güvenlik öncelikli
                yaklaşımı sahadaki her sürece taşıyarak Türkiye'nin operasyonel dijitalleşme standardı olmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neden qimlik? */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Neden qimlik?</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 640, margin: '0 auto' }}>
              Operasyonel süreçlerinizi tek çatı altında toplayan, maliyeti düşüren ve verilerinizi güvenle koruyan bir altyapı.
            </p>
          </div>

          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {degerler.map(({ icon: Icon, color, baslik, metin }) => (
              <div key={baslik} className="feature-card glass-card">
                <div className="feature-icon" style={{ background: `${color}1a`, color }}>
                  <Icon size={28} />
                </div>
                <h3>{baslik}</h3>
                <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: 1.65 }}>{metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rakamlarla qimlik */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Rakamlarla qimlik</h2>
            <p className="text-muted" style={{ fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
              Abartısız, ölçülebilir vaatler. İşte platformun sunduğu somut değerler.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {metrikler.map(({ deger, etiket }, i) => {
              const iconlar = [Boxes, KeyRound, Wallet, Lock];
              const renkler = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];
              const Icon = iconlar[i];
              return (
                <div
                  key={etiket}
                  className="glass-card"
                  style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div className="feature-icon" style={{ background: `${renkler[i]}1a`, color: renkler[i], marginBottom: '0.5rem' }}>
                    <Icon size={26} />
                  </div>
                  <div className="gradient-text" style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.1 }}>{deger}</div>
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>{etiket}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Şirket künyesi (YER TUTUCU — kullanıcı dolduracak) */}
      <section style={{ padding: '3rem 0 5rem' }}>
        <div className="container">
          <div className="glass-card" style={{ padding: '2.5rem', maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Şirket Künyesi</h2>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Resmi şirket bilgileri. (Aşağıdaki alanlar yer tutucudur, güncel bilgilerle doldurulacaktır.)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {[
                ['Şirket Ünvanı', '[Şirket Ünvanı]'],
                ['Kuruluş Yılı', '[Kuruluş Yılı]'],
                ['Adres', '[Adres]'],
              ].map(([etiket, deger]) => (
                <div key={etiket} style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.03)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>{etiket}</div>
                  <div style={{ fontWeight: 600 }}>{deger}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '4rem 0 6rem', background: 'var(--bg-alt)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>
            İşletmenizi <span className="gradient-text">qimlik</span> ile dijitalleştirin
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Size özel bir demo ve teklif için ekibimizle görüşün. İhtiyacınıza uygun çözümü birlikte planlayalım.
          </p>
          <Link to="/iletisim" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            İletişime Geçin <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
