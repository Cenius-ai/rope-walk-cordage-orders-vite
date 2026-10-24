import { useEffect, useRef } from "react";

/** A real modal dialog: Escape and Cancel both dismiss, focus starts on Cancel. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? "confirm-description" : undefined}
      >
        <h2 className="dialog__title" id="confirm-title">
          {title}
        </h2>
        {description ? (
          <p className="dialog__body" id="confirm-description">
            {description}
          </p>
        ) : null}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} ref={cancelRef}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy ? "true" : undefined}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
