// NOT: Şirket künyesi (ünvan, adres, vergi dairesi/no, KEP, telefon) netleşince
// aşağıdaki [ ... ] yer tutucuları gerçek bilgilerle doldurulacak.
import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero';

// Yasal metinlerde tekrar eden bölüm başlığı + içerik kalıbı.
function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2.75rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', lineHeight: 1.3 }}>{title}</h2>
      {children}
    </section>
  );
}

const p = { color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem', fontSize: '1.02rem' };
const ul = { color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 1.25rem 1.25rem', fontSize: '1.02rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' };

export default function Privacy() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="GİZLİLİK"
        title="Gizlilik Politikası"
        subtitle="qimlik olarak verilerinizin güvenliğine önem veriyoruz. Bu politika, platformumuzu kullanırken hangi verileri neden topladığımızı, nasıl koruduğumuzu ve haklarınızı açıklar."
        accent="#6366f1"
      />

      <section style={{ padding: '3.5rem 0 4.5rem' }}>
        <div className="container" style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>

          <Section title="1. Hangi Verileri Neden Topluyoruz?">
            <p style={p}>
              qimlik, bir yazılım hizmeti (SaaS) platformudur ve sunduğu modüllerin (OTP doğrulama,
              Mesai, Teslimat, Dijital) çalışabilmesi için gerekli olan asgari veriyi toplar.
              Topladığımız veriler ve amaçları şunlardır:
            </p>
            <ul style={ul}>
              <li><strong>Telefon numarası:</strong> Tek kullanımlık kod (OTP) ile personel ve kurye girişlerinin doğrulanması.</li>
              <li><strong>Ad-soyad ve iletişim bilgileri:</strong> Kullanıcının tanımlanması ve işlemlerin doğru kişiye bağlanması.</li>
              <li><strong>GPS konum verisi:</strong> Mesai giriş/çıkış kaydı, teslimat kanıtı ve bakım konumunun doğrulanması.</li>
              <li><strong>Dijital imza görüntüsü ve fotoğraf:</strong> Teslimat onayı ile personel/bakım süreçlerinin belgelenmesi.</li>
              <li><strong>İşlem kayıtları (loglar):</strong> Hizmet güvenliği, hata tespiti ve işlem doğrulama.</li>
            </ul>
          </Section>

          <Section title="2. Çerezler ve Yerel Depolama">
            <p style={p}>
              Platform, oturumunuzun sürekliliğini sağlamak için tarayıcınızın yerel depolama
              (localStorage) alanında oturum anahtarınızı (token) tutar. Bu anahtar, her istekte
              yeniden giriş yapmanıza gerek kalmadan kimliğinizi doğrulamak için kullanılır. Yerel
              depolamadaki bu veri, oturumu kapattığınızda veya çıkış yaptığınızda temizlenir.
              Zorunlu işlevsellik dışında, sizi izlemeye yönelik pazarlama amaçlı çerezler
              kullanılmamaktadır.
            </p>
          </Section>

          <Section title="3. Veri Güvenliği Önlemleri">
            <p style={p}>
              Verilerinizin güvenliği için hem teknik hem idari tedbirler uygulanır:
            </p>
            <ul style={ul}>
              <li><strong>Şifreli iletişim (HTTPS):</strong> Uygulama ile sunucu arasındaki tüm veri trafiği şifrelenerek iletilir.</li>
              <li><strong>Hash'li parola saklama:</strong> Parolalar açık metin olarak değil, geri döndürülemez şekilde özetlenerek (hash) saklanır.</li>
              <li><strong>Tek kullanımlık kod (OTP):</strong> Doğrulama kodları sunucu tarafında üretilir, kısa ömürlüdür ve yalnızca bir kez kullanılabilir.</li>
              <li><strong>Yetki ayrımı:</strong> Kullanıcılar rollerine göre yalnızca yetkili oldukları verilere ve işlemlere erişebilir.</li>
              <li>Erişim kayıtlarının tutulması ve düzenli güvenlik gözden geçirmeleri.</li>
            </ul>
          </Section>

          <Section title="4. Üçüncü Taraflar">
            <p style={p}>
              Verilerinizi pazarlama amacıyla üçüncü taraflara satmayız veya kiralamayız. Yalnızca
              hizmetin sunulması için zorunlu olan altyapı sağlayıcılarıyla (SMS ve WhatsApp
              doğrulama mesajı gönderim servisleri, bulut sunucu/barındırma tedarikçileri) ve yasal
              yükümlülük gereği yetkili kamu kurumlarıyla, gerekli olduğu ölçüde veri paylaşımı
              yapılabilir. Bu paylaşımlar, hizmetin çalışması için gereken asgari veriyle sınırlıdır.
            </p>
          </Section>

          <Section title="5. Konum Verisinin Kullanımı">
            <p style={p}>
              GPS konum veriniz yalnızca ilgili işlemi (mesai giriş/çıkış, teslimat kanıtı, bakım
              konumu) gerçekleştirdiğiniz anda ve o işlemi doğrulamak amacıyla alınır. Konum
              verisi, sizi arka planda sürekli izlemek için kullanılmaz. Cihazınızın konum iznini
              istediğiniz zaman ayarlarınızdan yönetebilirsiniz; ancak konum izni verilmediğinde
              konuma dayalı işlemler (örneğin mesai kaydı) çalışmayabilir.
            </p>
          </Section>

          <Section title="6. Kullanıcı Hakları">
            <p style={p}>
              6698 sayılı KVKK kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bilgi
              talep etme, düzeltilmesini veya silinmesini isteme dahil olmak üzere kanunda sayılan
              tüm haklara sahipsiniz. Haklarınızın tamamı ve başvuru yöntemi için{' '}
              <Link to="/kvkk">KVKK Aydınlatma Metni</Link> sayfamızı inceleyebilirsiniz.
            </p>
          </Section>

          <Section title="7. Politikadaki Değişiklikler">
            <p style={p}>
              Bu gizlilik politikası, mevzuattaki gelişmeler veya hizmetlerimizdeki değişiklikler
              doğrultusunda güncellenebilir. Güncel metin her zaman bu sayfada yayımlanır; önemli
              değişikliklerde kullanıcılar uygun yöntemlerle bilgilendirilir. Politikayı düzenli
              olarak gözden geçirmenizi öneririz.
            </p>
          </Section>

          <Section title="8. İletişim">
            <p style={p}>
              Gizlilikle ilgili soru, talep ve başvurularınız için bize aşağıdaki kanallardan
              ulaşabilirsiniz:
            </p>
            <ul style={ul}>
              <li><strong>Ünvan:</strong> [Şirket Ünvanı]</li>
              <li><strong>Adres:</strong> [Adres]</li>
              <li><strong>KEP Adresi:</strong> [KEP adresi]</li>
              <li><strong>Telefon:</strong> [Telefon]</li>
            </ul>
          </Section>

          <p style={{ ...p, fontStyle: 'italic', fontSize: '0.95rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            Bu metin bilgilendirme amaçlıdır; nihai hukuki metin için avukat görüşü alınmalıdır.
          </p>

          <p style={{ ...p, fontSize: '0.95rem' }}>
            İlgili diğer metinler: <Link to="/kvkk">KVKK Aydınlatma Metni</Link> ve{' '}
            <Link to="/kullanim-sartlari">Kullanım Şartları</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
