import { Link } from 'react-router-dom';
import {
  Check,
  Sparkles,
  Building2,
  Rocket,
  ShieldCheck,
  Lock,
  Server,
  MessageSquare,
} from 'lucide-react';
import PageHero from '../components/PageHero';

// Fiyatlandırma sayfası. Fiyatlar teklif usulüdür; kartlarda rakam yerine kapsam listelenir.
const PLANS = [
  {
    key: 'baslangic',
    name: 'Başlangıç',
    icon: Rocket,
    color: '#0ea5e9',
    tagline: 'Küçük ekipler ve tek modülle başlangıç için',
    highlighted: false,
    features: [
      'Tek qimlik modülü (OTP, Mesai, Teslimat veya Dijital)',
      'Tek kullanımlık kod (OTP) ile güvenli doğrulama',
      'Standart webhook (dış sisteminize otomatik bildirim) entegrasyonu',
      'Firma bazlı kod ön eki (prefix)',
      'E-posta üzerinden destek',
    ],
  },
  {
    key: 'profesyonel',
    name: 'Profesyonel',
    icon: Sparkles,
    color: '#6366f1',
    tagline: 'Büyüyen işletmeler ve çoklu modül kullanımı için',
    highlighted: true,
    features: [
      'Birden fazla qimlik modülü tek panelde',
      'Yüksek hacimli doğrulama ve genişletilmiş kullanım kotası',
      'Gelişmiş raporlama ve dışa aktarma',
      'Çoklu kullanıcı ve rol yönetimi',
      'Öncelikli e-posta ve telefon desteği',
    ],
  },
  {
    key: 'kurumsal',
    name: 'Kurumsal',
    icon: Building2,
    color: '#0f172a',
    tagline: 'Özel entegrasyon ve garantili hizmet seviyesi için',
    highlighted: false,
    features: [
      'Tüm modüller ve sınırsız ölçek',
      'Özel entegrasyon ve size özel API akışları',
      'SLA (hizmet seviyesi anlaşması) ile garantili çalışma süresi',
      'Kurumsal veri güvenliği ve isteğe bağlı özel sunucu (on-premise)',
      'Öncelikli 7/24 destek ve atanmış müşteri temsilcisi',
    ],
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, text: 'KVKK uyumlu veri işleme' },
  { icon: Lock, text: 'Tek kullanımlık, sunucu-taraflı OTP' },
  { icon: Server, text: 'Şifreli veri saklama ve yedekleme' },
  { icon: MessageSquare, text: 'Webhook ile kolay entegrasyon' },
];

export default function Pricing() {
  return (
    <div style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <PageHero
        badge="FİYATLANDIRMA"
        title="İhtiyacınıza özel, şeffaf teklif"
        subtitle="Her işletmenin ölçeği, kullanım hacmi ve modül ihtiyacı farklıdır. Bu yüzden tek tip liste fiyatı yerine, kullandığınız modül sayısına ve büyüklüğünüze göre size özel bir teklif hazırlıyoruz. Ödediğiniz her kalemi baştan net görürsünüz; sürpriz maliyet yoktur."
        accent="#6366f1"
      />

      {/* Paket kartları */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div
            className="feature-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'stretch' }}
          >
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.key}
                  className="glass-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2.25rem 2rem',
                    border: plan.highlighted
                      ? `2px solid ${plan.color}`
                      : '1px solid var(--border-light)',
                    boxShadow: plan.highlighted
                      ? '0 25px 50px -12px rgba(99, 102, 241, 0.25)'
                      : undefined,
                    transform: plan.highlighted ? 'translateY(-6px)' : undefined,
                  }}
                >
                  {plan.highlighted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                        color: '#fff',
                        padding: '0.35rem 1rem',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      EN ÇOK TERCİH EDİLEN
                    </div>
                  )}

                  <div
                    className="feature-icon"
                    style={{ background: `${plan.color}1a`, color: plan.color }}
                  >
                    <Icon size={28} />
                  </div>

                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{plan.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {plan.tagline}
                  </p>

                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      marginBottom: '1.5rem',
                      color: plan.color,
                    }}
                  >
                    Teklif usulü
                    <span className="text-muted" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 400, marginTop: '0.25rem' }}>
                      Kullanımınıza göre belirlenir
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.85rem', flexGrow: 1 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', fontSize: '0.92rem', lineHeight: 1.5 }}>
                        <Check size={18} color={plan.color} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/iletisim"
                    className={plan.highlighted ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '100%', textAlign: 'center', justifyContent: 'center', textDecoration: 'none', padding: '0.85rem' }}
                  >
                    Teklif Al
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tüm paketlerde standart güven şeridi */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Tüm paketlerde standart</h2>
            <p className="text-muted" style={{ fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' }}>
              Hangi paketi seçerseniz seçin, güvenlik ve uyum konusundaki temel garantiler her müşterimiz için aynıdır.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
            {TRUST_BADGES.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem', border: '1px solid var(--border-light)' }}
                >
                  <div style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>
                    <Icon size={24} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div
            className="glass-card"
            style={{
              maxWidth: 760,
              margin: '0 auto',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
              border: '1px solid var(--border-light)',
            }}
          >
            <h2 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Size özel fiyat için görüşelim</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Kaç kullanıcınız olduğunu, hangi modülleri kullanmak istediğinizi ve aylık tahmini hacminizi bize iletin; 24 saat içinde şeffaf ve size özel bir teklifle dönelim.
            </p>
            <Link
              to="/iletisim"
              className="btn btn-primary"
              style={{ textDecoration: 'none', padding: '0.9rem 2rem', display: 'inline-flex' }}
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
