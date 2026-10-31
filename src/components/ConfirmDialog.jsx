import { useEffect, useRef } from 'preact/hooks';

// Confirmation built on the native <dialog>: showModal() gives a focus trap, Escape to close,
// an inert page behind it, and focus returns to the button that opened it when it closes.
// Cancel comes first in the DOM, so it is the focused (safe) default.
// Browsers without showModal() (before 2022) fall back to window.confirm, so a reset is never unconfirmed.
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (typeof d.showModal !== 'function') {
      if (open) (window.confirm(`${title}\n\n${body}`) ? onConfirm : onClose)();
      return;
    }
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      class="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-body"
      onClose={onClose} // fires for Escape and for close()
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
    >
      <div class="dialog-body">
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-body">{body}</p>
        <div class="actions">
          <button type="button" class="btn" onClick={onClose}>Cancel</button>
          <button type="button" class="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}
