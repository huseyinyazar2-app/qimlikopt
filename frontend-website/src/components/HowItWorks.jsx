// Reverse-OTP'nin 3 adimini gorsel anlatan bolum. Hero ile ayni dil (yuvarlak, marka renkleri).
// Fark yaratan mekanik: kodu SIZ gondermezsiniz, kullanici size gonderir -> SMS gideri sifir.

const STEPS = [
  {
    n: '01',
    color: '#0ea5e9',
    title: 'Kod ekranda gosterilir',
    desc: 'Uygulamanizda kullaniciya kisa, tek kullanimlik bir kod gosterilir. Kod sunucuda uretilir, 5 dakika gecerlidir.',
    art: 'screen',
  },
  {
    n: '02',
    color: '#10b981',
    title: 'Kullanici kodu size gonderir',
    desc: 'Kullanici bu kodu kendi telefonundan WhatsApp ile size ait dogrulama numarasina gonderir. Mesaj ucreti kullanicinin tarafindadir.',
    art: 'send',
  },
  {
    n: '03',
    color: '#6366f1',
    title: 'Aninda dogrulanir',
    desc: 'qimlik kodu eslestirir ve sonucu webhook ile sisteminize saniyeler icinde iletir. Sizin operator SMS gideriniz sifirdir.',
    art: 'webhook',
  },
];

function StepArt({ type, color }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="68" height="68" rx="20" fill={color} opacity="0.1" />
      {type === 'screen' && (
        <g>
          <rect x="26" y="16" width="26" height="42" rx="6" fill="#ffffff" stroke={color} strokeWidth="2" />
          <rect x="30" y="24" width="18" height="10" rx="3" fill={color} opacity="0.15" />
          <text x="39" y="32" textAnchor="middle" fontFamily="Outfit, monospace" fontSize="7" fontWeight="800" fill={color}>4821</text>
          <rect x="30" y="38" width="18" height="3" rx="1.5" fill={color} opacity="0.3" />
          <rect x="30" y="44" width="12" height="3" rx="1.5" fill={color} opacity="0.3" />
        </g>
      )}
      {type === 'send' && (
        <g>
          <circle cx="30" cy="38" r="14" fill="#ffffff" stroke={color} strokeWidth="2" />
          <path d="M24 38.5c0 3.6 3 6.5 6.6 6.5 1.2 0 2.4-.3 3.4-.9l3.3.9-.9-3.2c.6-1 .9-2.2.9-3.4 0-3.6-3-6.5-6.6-6.5s-6.6 2.9-6.6 6.5z" fill={color} />
          <path d="M42 24 l14 6 -14 6 3 -6 z" fill={color} />
          <path d="M45 30 h11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {type === 'webhook' && (
        <g>
          <rect x="24" y="26" width="24" height="20" rx="4" fill="#ffffff" stroke={color} strokeWidth="2" />
          <circle cx="36" cy="36" r="6" fill={color} />
          <path d="M33 36.5 l2 2 3.5-4" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 30 l6 6 -6 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section id="nasil-calisir" style={{ padding: '6rem 0', background: 'var(--bg-color)' }}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            REVERSE-OTP NASIL ÇALIŞIR?
          </div>
          <h2 className="gradient-text" style={{ fontSize: '2.6rem', marginBottom: '1rem' }}>Doğrulama kodunu siz göndermezsiniz</h2>
          <p className="text-muted" style={{ fontSize: '1.12rem', maxWidth: '620px', margin: '0 auto' }}>
            Klasik SMS'te her mesaj size fatura edilir. qimlik akışı tersine çevirir: kodu <strong>kullanıcı size gönderir</strong>. Böylece operatör SMS gideriniz tamamen sıfırlanır.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', fontFamily: 'Outfit, sans-serif', fontSize: '2.4rem', fontWeight: 800, color: s.color, opacity: 0.12 }}>{s.n}</div>
              <StepArt type={s.art} color={s.color} />
              <h3 style={{ fontSize: '1.25rem', margin: '1.25rem 0 0.75rem 0', color: 'var(--text-primary)' }}>{s.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.98rem', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
