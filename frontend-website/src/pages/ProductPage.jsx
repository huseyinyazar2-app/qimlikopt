import { useParams, Link, Navigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Truck, QrCode, Check, ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';
import ProductMock from '../components/ProductMock';
import { getProduct, PRODUCTS } from '../data/products';

const ICONS = { ShieldCheck, MapPin, Truck, QrCode };

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function ProductPage() {
  const { slug } = useParams();
  const product = getProduct(slug);
  if (!product) return <Navigate to="/" replace />;

  const Icon = ICONS[product.icon] || ShieldCheck;
  const others = PRODUCTS.filter((p) => p.slug !== slug);

  return (
    <div>
      <PageHero
        badge={product.tagline}
        title={product.name}
        subtitle={product.short}
        accent={product.color}
      />

      {/* Panel onizleme */}
      <section style={{ padding: '2.5rem 0 0.5rem' }}>
        <div className="container" style={{ maxWidth: 660, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '1rem', border: `1px solid ${hexToRgba(product.color, 0.18)}` }}>
            <ProductMock type={product.slug} />
          </div>
        </div>
      </section>

      {/* Sorun / Çözüm */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ef4444', marginBottom: '0.75rem' }}>SORUN</div>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.problem}</p>
          </div>
          <div className="glass-card" style={{ padding: '2rem', border: `1px solid ${hexToRgba(product.color, 0.25)}` }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: product.color, marginBottom: '0.75rem' }}>ÇÖZÜM</div>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.solution}</p>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Öne çıkan özellikler</h2>
            <p className="text-muted">{product.name} ile neler yapabilirsiniz?</p>
          </div>
          <div className="feature-grid">
            {product.features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon" style={{ background: hexToRgba(product.color, 0.1), color: product.color }}>
                  <Check size={26} />
                </div>
                <h3>{f.title}</h3>
                <p className="text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kimler için + kullanım senaryoları */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div className="feature-icon" style={{ background: hexToRgba(product.color, 0.1), color: product.color, marginBottom: '1.5rem' }}>
              <Icon size={26} />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Kimler için?</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.audience}</p>
          </div>
          <ul className="product-showcase-list">
            {product.useCases.map((u, i) => (
              <li key={i}>
                <ArrowRight size={20} style={{ color: product.color, flexShrink: 0, marginTop: 2 }} />
                <span><strong>{u}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-alt)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>{product.name}'i işletmenizde deneyin</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Size özel demo ve teklif için birkaç dakikada bize ulaşın.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/iletisim" className="btn btn-primary" style={{ textDecoration: 'none' }}>Teklif Al</Link>
            <Link to="/kayit" className="btn btn-outline" style={{ textDecoration: 'none' }}>Hemen Başla</Link>
          </div>
        </div>
      </section>

      {/* Diğer ürünler */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem' }}>Diğer çözümler</h2>
          </div>
          <div className="feature-grid">
            {others.map((p) => {
              const OIcon = ICONS[p.icon] || ShieldCheck;
              return (
                <Link to={`/urunler/${p.slug}`} key={p.slug} className="feature-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="feature-icon" style={{ background: hexToRgba(p.color, 0.1), color: p.color }}>
                    <OIcon size={26} />
                  </div>
                  <h3>{p.name}</h3>
                  <p className="text-muted">{p.short}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
