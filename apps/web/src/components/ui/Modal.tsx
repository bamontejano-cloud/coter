import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /** Whether the modal is rendered. */
  isOpen: boolean;
  /** Called when the user requests closing (escape / backdrop / X). */
  onClose: () => void;
  /** Dialog title — sets aria-labelledby. Use a short, descriptive string. */
  title: string;
  /** Dialog body content. */
  children: ReactNode;
  /** Optional footer area (e.g. action buttons). */
  footer?: ReactNode;
  /** Backdrop click closes the modal. Default: true. */
  dismissOnBackdrop?: boolean;
  /** Escape key closes the modal. Default: true. */
  dismissOnEscape?: boolean;
}

/**
 * Accessible modal dialog. Portal-rendered to document.body so it escapes
 * any stacking context and inherits z-indexing from --z-modal.
 *
 * Accessibility (WCAG 2.1.2 — No keyboard trap):
 *  - role="dialog" + aria-modal="true" + aria-labelledby={title}.
 *  - Closes on Escape by default.
 *  - Initial focus on first tabbable inside the dialog; restored to the
 *    previously-focused element on close.
 *  - Full focus trap — Tab / Shift+Tab cycle inside the dialog. If focus
 *    drifts outside (e.g. via a backdrop click) it is pulled back in.
 *  - Background page scroll is locked while the dialog is open.
 *  - prefers-reduced-motion disables the entrance animation.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function listTabbables(root: HTMLElement): HTMLElement[] {
      const SEL =
        'a[href], button:not([disabled]), input:not([disabled]),' +
        ' select:not([disabled]), textarea:not([disabled]),' +
        ' [tabindex]:not([tabindex="-1"])';
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(SEL));
      return nodes.filter((el) => {
        // Keep the dialog itself + the currently-focused element so we can
        // re-focus when nothing else is tabbable.
        if (el === dialogRef.current) return true;
        // Skip elements hidden by display:none ancestor.
        return el.offsetParent !== null || el === document.activeElement;
      });
    }

    function onKey(e: KeyboardEvent) {
      if (dismissOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = listTabbables(dialog);
      if (items.length === 0) {
        // Nothing tabbable — eat Tab so focus can't escape the dialog.
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !dialog.contains(active)) {
        // Focus drifted outside (backdrop click, etc.). Pull it back.
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);

    // Lock background scroll while open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Initial focus on first tabbable, else the dialog itself.
    const dialog = dialogRef.current!;
    const tabbables = listTabbables(dialog);
    (tabbables[0] ?? dialog).focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus?.();
    };
  }, [isOpen, onClose, dismissOnEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-portal" role="presentation">
      <div
        className="modal__backdrop"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
