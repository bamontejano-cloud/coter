import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default: primary. */
  variant?: ButtonVariant;
  /** Loading state — button is disabled, spinner replaces the label area. */
  isLoading?: boolean;
  /** Take the full width of the parent. Useful in forms. */
  fullWidth?: boolean;
}

/**
 * Primary UI button. Wraps native <button> with the design-system styles
 * (.button / .button--primary / .button--ghost / .button--danger) and adds
 * first-class loading support via isLoading.
 *
 * Loading state:
 *  - Button gets disabled and aria-busy="true"
 *  - data-loading is added for CSS hooks (slightly tinted cursor: progress)
 *  - A small Spinner renders before the label so the click is acknowledged
 *    visually even when the label size alone wouldn't change.
 *
 * NOTE: callers still control the label text. For a typical "Entrar" →
 * "Cargando…" toggle, pass `{loading ? 'Cargando…' : 'Entrar'}` as children.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    isLoading = false,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'button',
    `button--${variant}`,
    fullWidth ? 'button--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      {...rest}
    >
      {isLoading && <Spinner size="sm" label={typeof children === 'string' ? children : 'Cargando…'} />}
      {children}
    </button>
  );
});
