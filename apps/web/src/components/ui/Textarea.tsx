import { forwardRef, TextareaHTMLAttributes, ReactNode, useId } from 'react';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-invalid'> {
  /** Visible field label. Rendered as a <label for=...>. Required. */
  label: string;
  /** Helper text under the textarea — announced via aria-describedby. */
  hint?: ReactNode;
  /** Error message. Marks aria-invalid + adds aria-errormessage. */
  error?: string;
}

/**
 * Multiline text input with label + optional hint / error.
 *
 * Accessibility mirrors <Input /> so a form page can swap one for the other
 * without a11y regressions:
 *  - <label htmlFor=...> wired to the textarea id.
 *  - hint → aria-describedby, error → aria-describedby + aria-invalid="true".
 *  - error is rendered with role="alert" so screen readers announce it
 *    immediately when it appears.
 *  - auto-id via React.useId so multiple Textareas on the same page never
 *    collide even if the caller forgets to pass an id.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className = '', rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `textarea-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`field__input field__textarea${error ? ' field__input--error' : ''}${className ? ` ${className}` : ''}`}
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
