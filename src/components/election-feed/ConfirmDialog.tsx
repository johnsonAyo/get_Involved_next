"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  eyebrow: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  eyebrow,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isBusy = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
      <div className="confirm-dialog__backdrop" onClick={onCancel} />
      <div className="confirm-dialog__sheet" role="document">
        <p className="ds-eyebrow ds-eyebrow--accent confirm-dialog__eyebrow">
          {eyebrow}
        </p>
        <h2
          id="confirm-dialog-title"
          className="confirm-dialog__title"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="confirm-dialog__message"
        >
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="ds-button ds-button--ghost confirm-dialog__btn"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="ds-button ds-button--primary confirm-dialog__btn"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
