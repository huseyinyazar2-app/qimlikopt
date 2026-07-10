import { Plus } from 'lucide-react';

/**
 * Ortalanmış boş-durum kartı.
 * props:
 *  - icon: lucide-react ikon bileşeni (JSX değil, bileşenin kendisi). Örn: Users
 *  - title: başlık metni
 *  - description: kısa açıklama
 *  - actionLabel: (opsiyonel) birincil eylem butonu metni
 *  - onAction: (opsiyonel) butona tıklanınca çalışacak fonksiyon
 *  - actionIcon: (opsiyonel) buton ikonu bileşeni (varsayılan: Plus)
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionIcon: ActionIcon = Plus }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(14, 165, 233, 0.1)',
          color: 'var(--brand-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
        }}
      >
        {Icon && <Icon size={34} />}
      </div>

      <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>{title}</h3>

      {description && (
        <p className="text-muted" style={{ maxWidth: 420, margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}
        >
          {ActionIcon && <ActionIcon size={18} />} {actionLabel}
        </button>
      )}
    </div>
  );
}
