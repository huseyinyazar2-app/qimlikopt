import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import PageHero from '../components/PageHero';

// Sıkça sorulan sorular. Accordion dış kütüphane olmadan, sadece useState ile yapılır.
const FAQ_ITEMS = [
  {
    q: 'qimlik nedir?',
    a: 'qimlik; doğrulama, saha personel takibi, teslimat kanıtı ve makine bakımı gibi işletme süreçlerini tek bir platformda toplayan bir B2B (işletmeden işletmeye) yazılım ekosistemidir. Dört ana modülü vardır: qimlik OTP (doğrulama), qimlik Mesai (personel mesaisi), qimlik Teslimat (teslim kanıtı) ve qimlik Dijital (makine bakımı). İstediğiniz modülü tek başına ya da birlikte kullanabilirsiniz.',
  },
  {
    q: 'Ters-OTP (reverse OTP) nasıl çalışır ve neden SMS ücreti ödemiyorum?',
    a: 'Klasik doğrulamada firma, kullanıcıya SMS ile kod gönderir ve her mesaj için operatöre ücret öder. qimlik OTP bu akışı tersine çevirir: kod sunucuda üretilir ve kullanıcının ekranında gösterilir; kullanıcı bu kısa kodu WhatsApp veya SMS ile sizin numaranıza gönderir. Yani mesajı gönderen taraf kullanıcı olduğu için operatör SMS gideri size değil, kullanıcının kendi hattına yansır. Sizin doğrulama başına SMS maliyetiniz sıfır olur.',
  },
  {
    q: 'Verilerim güvende mi? KVKK ile uyumlu musunuz?',
    a: 'Evet. Veriler şifreli olarak saklanır ve düzenli yedeklenir. Doğrulama kodları sunucu tarafında üretilir, tek kullanımlıktır ve kısa süre sonra geçersiz olur. Kişisel verilerin işlenmesi KVKK (Kişisel Verilerin Korunması Kanunu) çerçevesinde yürütülür; kurumsal müşterilerimiz için isteğe bağlı olarak verinin sizin kendi sunucunuzda tutulduğu özel kurulum (on-premise) da sağlayabiliriz.',
  },
  {
    q: 'Mesai modülünde GPS konum doğrulaması nasıl çalışır?',
    a: 'qimlik Mesai\'de her çalışma alanı için bir coğrafi sınır (geofence) tanımlarsınız. Personel telefonundan giriş veya çıkış yaptığında konumu alınır ve bu tanımlı alana olan mesafesiyle birlikte kaydedilir. Tanımlı alan dışından yapılan girişler otomatik olarak "sınır dışı" işaretlenir ve sapma mesafesi rapora yansır; böylece saha dışı işlemler yöneticiye görünür olur.',
  },
  {
    q: 'Teslimat modülünde imza ve teslim kanıtı nasıl saklanıyor?',
    a: 'Her paket bir kuryeye zimmetlenir. Teslimat anında alıcı, telefonuna gelen tek kullanımlık kodu onaylar ve kuryenin cihazına parmağıyla dijital imza atar. İmza görseli, GPS konumu ve teslim saati birlikte kayıt altına alınır. Böylece her teslimatın alıcı onaylı, imzalı ve konumlu bir kanıtı oluşur; olası anlaşmazlıklarda bu kayda başvurulabilir.',
  },
  {
    q: 'Kurulum ne kadar sürer?',
    a: 'qimlik bulut tabanlı (cloud) bir hizmet olduğu için ayrı bir sunucu kurmanıza gerek yoktur. Hesabınız açıldıktan sonra tek modüllü basit kullanımlar genellikle aynı gün devreye alınabilir. Webhook ile dış sisteme bağlanma veya özel entegrasyon gerektiren senaryolarda süre, projenin kapsamına göre birkaç güne kadar çıkabilir.',
  },
  {
    q: 'Mevcut sistemime entegre olur mu?',
    a: 'Evet. qimlik, webhook (bir olay gerçekleştiğinde sizin sisteminize otomatik bildirim gönderen web servis çağrısı) desteği sunar. Örneğin bir doğrulama tamamlandığında sonuç anında sizin uygulamanıza iletilir. Standart web servisleriyle çalıştığı için hemen her programlama diliyle entegre edilebilir; kurumsal pakette size özel API akışları da tanımlanabilir.',
  },
  {
    q: 'Fiyat nasıl belirleniyor?',
    a: 'Tek tip liste fiyatı yerine teklif usulü çalışıyoruz. Kullanmak istediğiniz modül sayısı, kullanıcı adediniz ve aylık tahmini işlem hacminize göre size özel bir teklif hazırlıyoruz. Böylece yalnızca gerçekten kullandığınız kapsam kadar ödersiniz. Ayrıntılar için Fiyatlandırma sayfamıza bakabilir veya doğrudan teklif isteyebilirsiniz.',
  },
  {
    q: 'Kurulumdan sonra destek alabiliyor muyum?',
    a: 'Evet. Tüm paketlerde destek sağlanır. Başlangıç pakette e-posta desteği, Profesyonel pakette öncelikli e-posta ve telefon desteği, Kurumsal pakette ise atanmış müşteri temsilcisi ile öncelikli 7/24 destek sunulur.',
  },
  {
    q: 'Personelim veya müşterim için ayrı bir mobil uygulama indirmek gerekli mi?',
    a: 'Çoğu senaryoda hayır. Doğrulama ve teslimat onayı gibi akışlar WhatsApp/SMS ve web tarayıcı üzerinden yürüdüğü için son kullanıcının özel bir uygulama kurmasına genellikle gerek kalmaz. Saha personeli için web tabanlı arayüz mobil tarayıcıda sorunsuz çalışır; bu da kurulum ve benimseme sürecini hızlandırır.',
  },
];

function FaqRow({ item, isOpen, onToggle }) {
  return (
    <div
      className="glass-card"
      style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{item.q}</span>
        <ChevronDown
          size={20}
          color="var(--brand-primary)"
          style={{
            flexShrink: 0,
            transition: 'transform 0.25s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? '600px' : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
        }}
      >
        <p
          className="text-muted"
          style={{ padding: '0 1.5rem 1.5rem 1.5rem', margin: 0, fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="DESTEK"
        title="Sıkça sorulan sorular"
        subtitle="qimlik hakkında en çok merak edilenleri sizin için topladık. Aradığınız yanıtı bulamazsanız bize doğrudan yazabilirsiniz."
        accent="#0ea5e9"
      />

      <section style={{ padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqRow key={i} item={item} isOpen={openIndex === i} onToggle={() => toggle(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '3rem 0 5rem 0' }}>
        <div className="container">
          <div
            className="glass-card"
            style={{
              maxWidth: 700,
              margin: '0 auto',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              className="feature-icon"
              style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-primary)', margin: '0 auto 1.25rem auto' }}
            >
              <HelpCircle size={28} />
            </div>
            <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Sorunuz burada yok mu?</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 520, margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Aklınıza takılan her şeyi bize yazın; ekibimiz en kısa sürede yanıtlasın.
            </p>
            <Link
              to="/iletisim"
              className="btn btn-primary"
              style={{ textDecoration: 'none', padding: '0.9rem 2rem', display: 'inline-flex' }}
            >
              Bize Yazın
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
