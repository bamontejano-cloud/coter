import { ReactNode } from 'react';
import { Icon, IconName } from './Icon';

export interface EmptyStateProps {
  /** Decorative icon that represents the missing content. */
  icon: IconName;
  /** Short headline. */
  title: string;
  /** Optional supporting copy explaining what the user can do next. */
  description?: string;
  /** Optional primary action (e.g. <Button>CTA</Button>). */
  action?: ReactNode;
  className?: string;
}

/**
 * Friendly, non-empty empty state. Use anywhere a list/grid is empty rather
 * than rendering a bare "No data" string. Combines an icon, headline, copy
 * and an action so the user always has a path forward.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`} role="status">
      <div className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size="xl" />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
