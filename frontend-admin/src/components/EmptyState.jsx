export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionIcon: ActionIcon }) {
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
      {Icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(99, 102, 241, 0.08)',
            color: 'var(--brand-primary)',
            marginBottom: '1.25rem',
          }}
        >
          <Icon size={30} />
        </div>
      )}

      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.4rem' }}>{title}</h3>

      {description && (
        <p className="text-muted" style={{ maxWidth: 440, lineHeight: 1.6 }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          className="btn-primary"
          onClick={onAction}
          style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {ActionIcon && <ActionIcon size={18} />} {actionLabel}
        </button>
      )}
    </div>
  );
}
