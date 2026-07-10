import { Inbox } from 'lucide-react';

/**
 * Reusable centered empty-state card.
 *
 * Props:
 *  - icon: a lucide-react icon component (defaults to Inbox)
 *  - title: main heading text
 *  - description: supporting explanation text
 *  - actionLabel: label for the primary action button (optional)
 *  - onAction: click handler for the primary action button (optional)
 */
export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(14, 165, 233, 0.1)',
          color: 'var(--brand-primary)',
          marginBottom: '0.5rem',
        }}
      >
        <Icon size={34} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h3>

      {description && (
        <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: 420, lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
