import { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role'> {
  size?: SpinnerSize;
  /** Aria label announced to screen readers. Default: "Cargando…". */
  label?: string;
}

/**
 * Inline loading indicator. Pure SVG (no external font / icon dep) so it
 * inherits currentColor and slots into any context (button, toast, page).
 *
 * Accessibility:
 *  - role="status" so screen readers announce it via aria-live polite.
 *  - The SVG is aria-hidden because the wrapping <span> provides the label.
 *  - prefers-reduced-motion disables the rotation animation (handled in CSS).
 */
export function Spinner({ size = 'md', label = 'Cargando…', className = '', ...rest }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`spinner spinner--${size}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 1-9 9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
