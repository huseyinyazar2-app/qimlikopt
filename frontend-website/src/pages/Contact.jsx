import { useState } from 'react';
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  User,
  Building2,
  Layers,
  MessageSquare,
  Send,
  CheckCircle,
} from 'lucide-react';
import PageHero from '../components/PageHero';

const moduller = ['qimlik OTP', 'qimlik Mesai', 'qimlik Teslimat', 'qimlik Dijital'];

export default function Contact() {
  const [form, setForm] = useState({
    adSoyad: '',
    firma: '',
    eposta: '',
    telefon: '',
    modul: moduller[0],
    mesaj: '',
  });
  const [gonderildi, setGonderildi] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // NOT: Backend'de henüz iletişim endpoint'i yok. Endpoint eklendiğinde
    // burada gerçek API'ye POST bağlanacak. Şu an için kullanıcının e-posta
    // istemcisinde hazır bir taslak açan mailto yaklaşımı kullanılıyor.
    const konu = `Demo Talebi - ${form.firma || form.adSoyad} (${form.modul})`;
    const govde =
      `Ad Soyad: ${form.adSoyad}\n` +
      `Firma: ${form.firma}\n` +
      `E-posta: ${form.eposta}\n` +
      `Telefon: ${form.telefon}\n` +
      `İlgilenilen Modül: ${form.modul}\n\n` +
      `Mesaj:\n${form.mesaj}`;

    window.location.href = `mailto:hello@qimlik.com?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
    setGonderildi(true);
  };

  const iletisimBilgileri = [
    { icon: Mail, color: '#0ea5e9', etiket: 'E-posta', deger: 'hello@qimlik.com', href: 'mailto:hello@qimlik.com' },
    { icon: Phone, color: '#6366f1', etiket: 'Telefon', deger: '[Telefon]' },
    { icon: MapPin, color: '#10b981', etiket: 'Konum', deger: 'İstanbul, Türkiye' },
    { icon: Clock, color: '#f59e0b', etiket: 'Çalışma Saatleri', deger: 'Hafta içi 09:00 - 18:00' },
  ];

  const inputWrapper = { position: 'relative' };
  const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="İLETİŞİM"
        title="Size özel demo ve teklif için görüşelim"
        subtitle="İhtiyaçlarınızı dinleyelim, qimlik'in hangi modüllerinin işletmenize değer katacağını birlikte belirleyelim."
      />

      <section style={{ padding: '5rem 0 6rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>

            {/* SOL: İletişim bilgileri */}
            <div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>İletişim Bilgileri</h2>
              <p className="text-muted" style={{ fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                Sorularınız, demo talepleriniz veya iş birliği önerileriniz için bize aşağıdaki kanallardan
                ulaşabilirsiniz. En kısa sürede size dönüş yapacağız.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {iletisimBilgileri.map(({ icon: Icon, color, etiket, deger, href }) => {
                  const icerik = (
                    <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="feature-icon" style={{ background: `${color}1a`, color, width: 48, height: 48, marginBottom: 0, flexShrink: 0 }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{etiket}</div>
                        <div style={{ fontWeight: 600 }}>{deger}</div>
                      </div>
                    </div>
                  );
                  return href ? (
                    <a key={etiket} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{icerik}</a>
                  ) : (
                    <div key={etiket}>{icerik}</div>
                  );
                })}
              </div>
            </div>

            {/* SAĞ: Demo / iletişim formu */}
            <div className="glass-card" style={{ padding: '2.5rem' }}>
              {!gonderildi ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Demo Talep Formu</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Ad Soyad</label>
                      <div style={inputWrapper}>
                        <User size={18} style={iconStyle} />
                        <input type="text" name="adSoyad" required value={form.adSoyad} onChange={handleChange} placeholder="Örn: Ahmet Yılmaz" className="glass-input" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Firma</label>
                      <div style={inputWrapper}>
                        <Building2 size={18} style={iconStyle} />
                        <input type="text" name="firma" value={form.firma} onChange={handleChange} placeholder="Örn: Aktaş Holding" className="glass-input" />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>E-posta</label>
                      <div style={inputWrapper}>
                        <Mail size={18} style={iconStyle} />
                        <input type="email" name="eposta" required value={form.eposta} onChange={handleChange} placeholder="ornek@firma.com" className="glass-input" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Telefon</label>
                      <div style={inputWrapper}>
                        <Phone size={18} style={iconStyle} />
                        <input type="tel" name="telefon" value={form.telefon} onChange={handleChange} placeholder="+90 5xx xxx xx xx" className="glass-input" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>İlgilendiğiniz Modül</label>
                    <div style={inputWrapper}>
                      <Layers size={18} style={iconStyle} />
                      <select name="modul" value={form.modul} onChange={handleChange} className="glass-input" style={{ appearance: 'none', cursor: 'pointer' }}>
                        {moduller.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Mesajınız</label>
                    <div style={inputWrapper}>
                      <MessageSquare size={18} style={{ ...iconStyle, top: '1.4rem', transform: 'none' }} />
                      <textarea name="mesaj" rows={5} value={form.mesaj} onChange={handleChange} placeholder="İhtiyaçlarınızı kısaca anlatın..." className="glass-input" style={{ resize: 'vertical', paddingTop: '0.85rem' }} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.9rem', width: '100%' }}>
                    Talebi Gönder <Send size={16} />
                  </button>
                  <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
                    Gönder'e bastığınızda, bilgileriniz hazır bir e-posta taslağı olarak açılır.
                  </p>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                    <CheckCircle size={30} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Talebiniz alındı</h2>
                  <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 1.75rem' }}>
                    En kısa sürede dönüş yapacağız. E-posta istemciniz açılmadıysa doğrudan{' '}
                    <a href="mailto:hello@qimlik.com" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>hello@qimlik.com</a>{' '}
                    adresine yazabilirsiniz.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setGonderildi(false)}
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Yeni Talep Oluştur
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
