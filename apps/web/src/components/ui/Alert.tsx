import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  /** Optional bold heading. */
  title?: string;
  children: ReactNode;
  /** When provided, renders a ✕ close button → onDismiss is fired. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline alert box. Use for content that should stick near the form / section
 * it relates to (validation errors, server-load failures, success confirmations
 * tied to a specific action).
 *
 * For ephemeral feedback (success after a copy-to-clipboard, transient info),
 * prefer `<Toast>` (see Toast.tsx) so it gets auto-dismissed and out of the
 * layout flow.
 *
 * Accessibility:
 *  - role="alert" for danger (assertive live region)
 *  - role="status" for info/success/warning (polite live region)
 */
export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return (
    <div
      className={`alert alert--${variant}${className ? ` ${className}` : ''}`}
      role={role}
    >
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        <div className="alert__body">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert__dismiss"
          aria-label="Cerrar aviso"
          onClick={onDismiss}
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}
