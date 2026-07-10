/**
 * Tekrar kullanılabilir boş-durum kartı.
 * Props:
 *  - icon: hazır render edilmiş ikon düğümü (örn. <Users size={44} />)
 *  - title: başlık metni
 *  - description: açıklama metni
 *  - actionLabel: birincil eylem butonunun metni (opsiyonel)
 *  - onAction: butona tıklanınca çalışacak fonksiyon (opsiyonel)
 */
export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
      }}
    >
      {icon && (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--brand-gradient)',
            color: '#fff',
            marginBottom: '1.25rem',
            boxShadow: '0 12px 30px var(--brand-glow)',
          }}
        >
          {icon}
        </div>
      )}

      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>

      {description && (
        <p
          className="text-muted"
          style={{ maxWidth: 380, fontSize: '0.9rem', lineHeight: 1.5, margin: '0.5rem 0 0' }}
        >
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
