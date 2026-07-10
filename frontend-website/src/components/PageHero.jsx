// Alt sayfalar için ortak başlık bandı. Tüm kurumsal/yasal/ürün sayfaları bunu kullanır.
export default function PageHero({ badge, title, subtitle, accent = 'var(--brand-primary)' }) {
  return (
    <section style={{
      padding: '7rem 0 3rem',
      background: `radial-gradient(circle at top center, ${hexToRgba(accent, 0.06)}, transparent 55%)`,
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div className="container" style={{ textAlign: 'center', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        {badge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: hexToRgba(accent, 0.1), border: `1px solid ${hexToRgba(accent, 0.2)}`,
            padding: '0.35rem 0.9rem', borderRadius: 999, fontSize: '0.8rem',
            color: accent, fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.25rem',
          }}>{badge}</div>
        )}
        <h1 style={{ fontSize: '2.8rem', lineHeight: 1.15, marginBottom: '1rem' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{subtitle}</p>
        )}
      </div>
    </section>
  );
}

function hexToRgba(hex, a) {
  if (!hex || !hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
