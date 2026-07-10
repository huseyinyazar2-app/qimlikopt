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

export default function Kvkk() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="KVKK"
        title="Kişisel Verilerin Korunması Aydınlatma Metni"
        subtitle="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, qimlik platformu üzerinden işlenen kişisel verileriniz hakkında sizi bilgilendirmek amacıyla hazırlanmıştır."
        accent="#0ea5e9"
      />

      <section style={{ padding: '3.5rem 0 4.5rem' }}>
        <div className="container" style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>

          <Section title="1. Veri Sorumlusunun Kimliği">
            <p style={p}>
              Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili
              mevzuat uyarınca, veri sorumlusu sıfatıyla aşağıda künyesi yer alan şirket tarafından
              hazırlanmıştır. qimlik, bir yazılım hizmeti (SaaS) platformu olarak çalışır; müşteri
              firmalar, kendi çalışan, kurye ve alıcılarına ait verileri bu platform üzerinden işler.
              Bu metinde, platformun işleticisi olarak topladığımız ve işlediğimiz kişisel verilere
              ilişkin esaslar açıklanmaktadır.
            </p>
            <ul style={ul}>
              <li><strong>Ünvan:</strong> [Şirket Ünvanı]</li>
              <li><strong>Adres:</strong> [Adres]</li>
              <li><strong>Vergi Dairesi / No:</strong> [Vergi Dairesi / No]</li>
              <li><strong>KEP Adresi:</strong> [KEP adresi]</li>
              <li><strong>Telefon:</strong> [Telefon]</li>
            </ul>
          </Section>

          <Section title="2. İşlenen Kişisel Veri Kategorileri">
            <p style={p}>
              Platformun sunduğu modüllerin (OTP doğrulama, Mesai, Teslimat, Dijital) çalışması için
              aşağıdaki kişisel veri kategorileri işlenebilmektedir:
            </p>
            <ul style={ul}>
              <li><strong>İletişim verileri:</strong> Telefon numarası (tek kullanımlık kod - OTP doğrulaması ile personel ve kurye girişleri için).</li>
              <li><strong>Kimlik ve iletişim bilgileri:</strong> Ad-soyad ve diğer iletişim bilgileri.</li>
              <li><strong>Konum verileri:</strong> GPS konum bilgisi (mesai giriş/çıkış kaydı, teslimat kanıtı ve bakım konumunun doğrulanması amacıyla).</li>
              <li><strong>Görsel veriler:</strong> Dijital imza görüntüsü (teslimat onayı için) ve fotoğraf (personel ve bakım süreçleri için).</li>
              <li><strong>İşlem güvenliği verileri:</strong> İşlem kayıtları (loglar), giriş/çıkış zaman damgaları ve sistem hareket kayıtları.</li>
            </ul>
          </Section>

          <Section title="3. Kişisel Verilerin İşlenme Amaçları">
            <p style={p}>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <ul style={ul}>
              <li>Kullanıcıların kimliğinin tek kullanımlık kod (OTP) ile doğrulanması ve yetkisiz erişimin önlenmesi.</li>
              <li>Personel mesai giriş/çıkış işlemlerinin konum tabanlı olarak kaydedilmesi ve doğrulanması.</li>
              <li>Teslimat süreçlerinde teslimatın gerçekleştiğinin dijital imza, konum ve fotoğraf ile kanıtlanması.</li>
              <li>Bakım ve saha operasyonlarının konum ve görsel kayıtlarla belgelenmesi.</li>
              <li>Hizmetin güvenliğinin sağlanması, hata tespiti ve işlem kayıtlarının (log) tutulması.</li>
              <li>Müşteri firmalarımıza sözleşme kapsamında raporlama ve destek hizmeti sunulması.</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi ve yetkili kurumların taleplerinin karşılanması.</li>
            </ul>
          </Section>

          <Section title="4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri (KVKK m.5)">
            <p style={p}>
              Kişisel verileriniz, KVKK'nın 5. maddesinde düzenlenen aşağıdaki hukuki sebeplere
              dayanılarak işlenmektedir:
            </p>
            <ul style={ul}>
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (örneğin mesai ve teslimat kaydının tutulması).</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi.</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması (örneğin işlem güvenliği ve sahtecilik önleme).</li>
              <li>Kanunlarda açıkça öngörülmesi.</li>
              <li>Yukarıdaki şartların bulunmadığı hallerde ilgili kişinin açık rızasının alınması.</li>
            </ul>
          </Section>

          <Section title="5. Kişisel Verilerin Aktarılması">
            <p style={p}>
              Kişisel verileriniz, yalnızca yukarıda belirtilen amaçların gerçekleştirilmesi için gerekli
              olduğu ölçüde ve KVKK'nın 8. ve 9. maddelerine uygun olarak aşağıdaki taraflara
              aktarılabilir:
            </p>
            <ul style={ul}>
              <li>Hizmet aldığınız/hizmet verdiğiniz müşteri firmaya (veri sorumlusu/veri işleyen ilişkisi kapsamında).</li>
              <li>Kısa mesaj (SMS) ve WhatsApp gibi doğrulama mesajlarının iletilmesini sağlayan altyapı sağlayıcılarına (yalnızca gönderim için gerekli veriler).</li>
              <li>Bulut sunucu, barındırma ve teknik altyapı hizmeti aldığımız tedarikçilere.</li>
              <li>Hukuki yükümlülük gereği yetkili kamu kurum ve kuruluşlarına, adli mercilere.</li>
            </ul>
            <p style={p}>
              Aktarım yapılan tüm taraflarla veri güvenliğini sağlamaya yönelik gerekli teknik ve
              idari tedbirler kapsamında hareket edilir.
            </p>
          </Section>

          <Section title="6. Kişisel Verilerin Toplanma Yöntemi">
            <p style={p}>
              Kişisel verileriniz; qimlik mobil uygulaması ve web arayüzü üzerinden, doğrulama
              amacıyla kullanılan SMS ve WhatsApp mesaj altyapıları (gateway) aracılığıyla,
              tamamen veya kısmen otomatik yöntemlerle toplanmaktadır. Konum ve görsel veriler,
              cihazınızın izin verdiği ölçüde ve ilgili işlemi (mesai, teslimat, bakım)
              gerçekleştirdiğiniz anda alınır.
            </p>
          </Section>

          <Section title="7. Kişisel Verilerin Saklanma Süresi">
            <p style={p}>
              Kişisel verileriniz, işlendikleri amaç için gerekli olan süre boyunca ve ilgili
              mevzuatta öngörülen zamanaşımı ve saklama süreleri boyunca muhafaza edilir. Amacın
              ortadan kalkması ve yasal saklama sürelerinin dolması halinde verileriniz silinir,
              yok edilir veya anonim hale getirilir. Müşteri firmalarımızla yapılan sözleşmeler
              kapsamında işlenen veriler için saklama süresi, ilgili sözleşme ve mevzuata göre
              belirlenir.
            </p>
          </Section>

          <Section title="8. İlgili Kişinin Hakları (KVKK m.11)">
            <p style={p}>KVKK'nın 11. maddesi uyarınca, veri sorumlusuna başvurarak şu haklara sahipsiniz:</p>
            <ul style={ul}>
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
              <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme.</li>
              <li>Düzeltme, silme ve yok etme işlemlerinin, aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
              <li>Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.</li>
              <li>Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.</li>
            </ul>
          </Section>

          <Section title="9. Başvuru Yöntemi">
            <p style={p}>
              Yukarıda sayılan haklarınıza ilişkin taleplerinizi, kimliğinizi tevsik edici belgelerle
              birlikte yazılı olarak [Adres] adresine veya [KEP adresi] KEP adresine iletebilirsiniz.
              Talebiniz, KVKK'nın öngördüğü süre içinde (en geç 30 gün) ücretsiz olarak
              sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi halinde Kurul tarafından
              belirlenen tarife üzerinden ücret alınabilir.
            </p>
          </Section>

          <p style={{ ...p, fontStyle: 'italic', fontSize: '0.95rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            Bu metin bilgilendirme amaçlıdır; nihai hukuki metin için avukat görüşü alınmalıdır.
          </p>

          <p style={{ ...p, fontSize: '0.95rem' }}>
            İlgili diğer metinler: <Link to="/gizlilik">Gizlilik Politikası</Link> ve{' '}
            <Link to="/kullanim-sartlari">Kullanım Şartları</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
