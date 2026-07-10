import { Plus } from 'lucide-react';

/**
 * Tekrar kullanılabilir boş-durum kartı.
 * props:
 *  - icon: lucide-react bileşeni (örn: Box), zorunlu değil
 *  - title: başlık metni
 *  - description: açıklama metni
 *  - actionLabel: birincil eylem butonu metni (opsiyonel)
 *  - onAction: butona tıklanınca çalışacak fonksiyon (opsiyonel)
 *  - actionIcon: buton ikonu (opsiyonel, varsayılan Plus)
 *  - fullSpan: grid içinde tüm satırı kaplasın mı
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionIcon: ActionIcon = Plus, fullSpan = false }) {
  return (
    <div
      className="glass-card"
      style={{
        gridColumn: fullSpan ? '1 / -1' : undefined,
        textAlign: 'center',
        padding: '3.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {Icon && (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(2, 132, 199, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <Icon size={40} color="var(--brand-primary)" />
        </div>
      )}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
      {description && (
        <p className="text-muted" style={{ maxWidth: 420, margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          <ActionIcon size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
