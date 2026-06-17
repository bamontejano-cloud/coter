import { ReactNode } from 'react';
import { Icon, IconName } from './Icon';

export interface StatCardProps {
  /** Short label rendered above the value (e.g. "Pacientes activos"). */
  label: string;
  /** Big number or short text — primary focus of the card. */
  value: string | number;
  /** Decorative icon for visual identification. */
  icon: IconName;
  /** Optional supporting copy under the value (e.g. "este mes"). */
  description?: string;
  /** Optional trend chip (up/down/flat + label like "+12%"). */
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  /** Optional CTA in the upper-right corner. */
  action?: ReactNode;
  /**
   * Tints the icon background. Defaults to brand teal. Use 'success' /
   * 'warning' / 'danger' / 'info' to surface semantic meaning.
   */
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

/**
 * Big-number card for dashboards. One of these stacked horizontally gives
 * the "looking-glass" feel of SaaS admin panels: patient count, unread
 * messages, pending reviews, etc.
 */
export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  action,
  tone = 'brand',
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`} aria-label={label}>
      <header className="stat-card__header">
        <span className="stat-card__icon" aria-hidden="true">
          <Icon name={icon} size="md" />
        </span>
        <span className="stat-card__label">{label}</span>
        {action && <div className="stat-card__action">{action}</div>}
      </header>

      <div className="stat-card__value">{value}</div>

      {description && <p className="stat-card__description">{description}</p>}

      {trend && (
        <div className={`stat-card__trend stat-card__trend--${trend.direction}`}>
          <Icon
            name={trend.direction === 'up' ? 'ArrowRight' : trend.direction === 'down' ? 'ChevronDown' : 'ChevronRight'}
            size="xs"
          />
          <span>{trend.label}</span>
        </div>
      )}
    </article>
  );
}
