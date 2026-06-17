import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> {
  /** Visible field label. Rendered as a <label for=...>. Required. */
  label: string;
  /** Helper text under the input — announced via aria-describedby. */
  hint?: ReactNode;
  /** Error message under the input. Marks aria-invalid + adds aria-errormessage. */
  error?: string;
}

/**
 * Text input with label + optional hint / error.
 *
 * Accessibility:
 *  - <label htmlFor=...> wired to the input id.
 *  - hint → aria-describedby, error → aria-describedby + aria-invalid="true".
 *  - error is also exposed via aria-errormessage for screen readers that
 *    read it when the input gets focus.
 *  - auto-id via React.useId so multiple Inputs on the same page never
 *    collide even if the caller forgets to pass an id.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = '', ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`field__input${error ? ' field__input--error' : ''}${className ? ` ${className}` : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
