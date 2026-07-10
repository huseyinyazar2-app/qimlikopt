// NOT: Şirket künyesi (ünvan, adres, vergi dairesi/no, KEP, telefon), yetkili
// mahkeme şehri ve yürürlük tarihi netleşince aşağıdaki [ ... ] yer tutucuları
// gerçek bilgilerle doldurulacak.
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

export default function Terms() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="KULLANIM ŞARTLARI"
        title="Kullanım Şartları"
        subtitle="qimlik platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. Lütfen hizmeti kullanmadan önce bu metni dikkatlice okuyunuz."
        accent="#0ea5e9"
      />

      <section style={{ padding: '3.5rem 0 4.5rem' }}>
        <div className="container" style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>

          <Section title="1. Hizmet Tanımı">
            <p style={p}>
              qimlik, işletmelerin doğrulama ve saha operasyonlarını dijitalleştirmelerini sağlayan
              bir yazılım hizmeti (SaaS) platformudur. Platform aşağıdaki modüllerden oluşur:
            </p>
            <ul style={ul}>
              <li><strong>qimlik OTP:</strong> Tek kullanımlık kod ile telefon numarası doğrulama.</li>
              <li><strong>qimlik Mesai:</strong> Konum tabanlı personel giriş/çıkış (mesai) takibi.</li>
              <li><strong>qimlik Teslimat:</strong> Dijital imza, konum ve fotoğraf ile teslimat kanıtı.</li>
              <li><strong>qimlik Dijital:</strong> Dijital form ve belge süreçlerinin yönetimi.</li>
            </ul>
            <p style={p}>
              Hizmetin kapsamı, aboneliğiniz ve müşteri firmanızla yapılan sözleşme çerçevesinde
              belirlenir.
            </p>
          </Section>

          <Section title="2. Hesap Oluşturma ve Sorumluluk">
            <p style={p}>
              Hizmeti kullanmak için doğru, güncel ve eksiksiz bilgilerle bir hesap oluşturmanız
              gerekir. Hesap bilgilerinizin ve doğrulama kodlarınızın gizliliğinden siz
              sorumlusunuz. Hesabınız üzerinden yapılan tüm işlemler sizin sorumluluğunuzdadır.
              Yetkisiz bir erişim veya güvenlik ihlali fark ederseniz gecikmeksizin bizi
              bilgilendirmelisiniz.
            </p>
          </Section>

          <Section title="3. Kabul Edilebilir Kullanım">
            <p style={p}>Hizmeti kullanırken aşağıdaki kurallara uymayı kabul edersiniz:</p>
            <ul style={ul}>
              <li>Hizmeti yalnızca hukuka uygun amaçlarla ve mevzuata uygun şekilde kullanmak.</li>
              <li>Başkasına ait bilgileri yetkisiz şekilde girmemek veya sahte kayıt oluşturmamak.</li>
              <li>Platformun güvenliğini tehlikeye atacak, sisteme izinsiz erişmeye yönelik girişimlerde bulunmamak.</li>
              <li>Konum, imza ve doğrulama verilerini yanıltıcı biçimde manipüle etmemek.</li>
              <li>Üçüncü kişilerin haklarını ihlal edecek içerik veya davranışlardan kaçınmak.</li>
            </ul>
          </Section>

          <Section title="4. Hizmet Seviyesi ve Kesinti">
            <p style={p}>
              Hizmetin kesintisiz ve hatasız çalışması için makul çabayı gösteririz; ancak bakım
              çalışmaları, altyapı sağlayıcı kaynaklı sorunlar veya öngörülemeyen teknik nedenlerle
              geçici kesintiler yaşanabilir. Planlı bakımlar mümkün olduğunca önceden duyurulur.
              Garantili çalışma süresi taahhütleri (SLA), yalnızca ilgili kurumsal sözleşmede açıkça
              yer alması halinde geçerlidir.
            </p>
          </Section>

          <Section title="5. Ücretlendirme">
            <p style={p}>
              qimlik hizmetleri teklif usulüyle fiyatlandırılır. Ücret; kullandığınız modül sayısı,
              kullanıcı adedi ve işlem hacmi gibi etkenlere göre size özel olarak belirlenir. Güncel
              koşullar için <Link to="/fiyatlandirma">Fiyatlandırma</Link> sayfamızı inceleyebilir
              veya bizimle iletişime geçerek size özel teklif talep edebilirsiniz. Ücretlere ilişkin
              ayrıntılar, taraflar arasında imzalanan sözleşmede düzenlenir.
            </p>
          </Section>

          <Section title="6. Fikri Mülkiyet">
            <p style={p}>
              qimlik platformu, yazılımı, markası, tasarımı ve tüm içeriği [Şirket Ünvanı]'na aittir
              ve fikri mülkiyet mevzuatıyla korunmaktadır. Size tanınan kullanım hakkı, hizmeti
              sözleşme kapsamında kullanmanızla sınırlıdır; bu hak, platform üzerinde herhangi bir
              mülkiyet devri anlamına gelmez. İzinsiz kopyalama, çoğaltma, kaynak koda erişme veya
              türev çalışma oluşturma yasaktır.
            </p>
          </Section>

          <Section title="7. Sorumluluğun Sınırlandırılması">
            <p style={p}>
              Hizmet, yürürlükteki mevzuatın izin verdiği azami ölçüde "olduğu gibi" sunulur.
              qimlik; dolaylı, arızi veya sonuç niteliğindeki zararlardan, veri kaybından veya kâr
              kaybından, mevzuatın izin verdiği ölçüde sorumlu tutulamaz. Bu, kasıt veya ağır kusur
              hallerini ortadan kaldırmaz. Sorumluluğa ilişkin sınırlar, kurumsal sözleşmelerde ayrıca
              düzenlenebilir.
            </p>
          </Section>

          <Section title="8. Fesih">
            <p style={p}>
              Bu şartlara aykırı davranılması halinde, hesabınızın erişimi geçici olarak askıya
              alınabilir veya sonlandırılabilir. Siz de dilediğiniz zaman, sözleşmede belirtilen
              usullere uygun olarak hizmet kullanımınızı sonlandırabilirsiniz. Fesih halinde
              verilerinizin işlenmesi ve saklanması, ilgili mevzuat ve{' '}
              <Link to="/kvkk">KVKK Aydınlatma Metni</Link> çerçevesinde yürütülür.
            </p>
          </Section>

          <Section title="9. Uygulanacak Hukuk ve Yetkili Mahkeme">
            <p style={p}>
              Bu Kullanım Şartları, Türkiye Cumhuriyeti hukukuna tabidir. İşbu şartlardan doğabilecek
              uyuşmazlıkların çözümünde [Şehir] Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </Section>

          <Section title="10. Yürürlük">
            <p style={p}>
              Bu Kullanım Şartları [Tarih] tarihinde yürürlüğe girmiştir. Şartlarda yapılacak
              güncellemeler bu sayfada yayımlanır ve yayımlandığı tarihte geçerli olur. Değişiklikten
              sonra hizmeti kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.
            </p>
          </Section>

          <p style={{ ...p, fontStyle: 'italic', fontSize: '0.95rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            Bu metin bilgilendirme amaçlıdır; nihai hukuki metin için avukat görüşü alınmalıdır.
          </p>

          <p style={{ ...p, fontSize: '0.95rem' }}>
            İlgili diğer metinler: <Link to="/kvkk">KVKK Aydınlatma Metni</Link> ve{' '}
            <Link to="/gizlilik">Gizlilik Politikası</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
