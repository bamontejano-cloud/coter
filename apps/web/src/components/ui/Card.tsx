import { HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Inner padding scale. Default: md. */
  padding?: CardPadding;
  /** Optional heading rendered in <header> (level h2). */
  title?: ReactNode;
  /** Optional subtitle under the title — muted by default. */
  subtitle?: ReactNode;
  /** Right-aligned action area in the header (e.g. <Button>). */
  actions?: ReactNode;
  /** Optional footer area — useful for "Cancelar / Confirmar" actions. */
  footer?: ReactNode;
  /** Element tag. Default: section. */
  as?: 'section' | 'div' | 'article';
}

/**
 * Container card / panel. Use for grouping related content on a page.
 *
 * Default attribute composition: `aria-label="title"` when a title is set so
 * the section lands cleanly in the page landmarks outline without forcing
 * callers to fiddle with aria-labelledby.
 */
export function Card({
  padding = 'md',
  title,
  subtitle,
  actions,
  footer,
  as,
  children,
  className = '',
  ...rest
}: CardProps) {
  const Tag = as ?? 'section';
  const classes = ['card', `card--padding-${padding}`, className].filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...rest}>
      {(title !== undefined || actions) && (
        <header className="card__header">
          {/* Always render the heading wrapper so its `flex: 1` keeps the actions
              right-aligned even when only `actions` is supplied. */}
          <div className="card__heading">
            {title !== undefined && (
              <>
                <h2 className="card__title">{title}</h2>
                {subtitle && <p className="card__subtitle">{subtitle}</p>}
              </>
            )}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </Tag>
  );
}
