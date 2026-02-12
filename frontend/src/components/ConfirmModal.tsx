"use client";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-modal">
        <h3 id="confirm-title">{title}</h3>
        <p className="status">{description}</p>
        <div className="confirm-actions">
          <button
            className="button ghost small"
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>
          <button
            className="text-sm border rounded-full font-semibold px-4 py-2 bg-red-600 text-white"
            style={{
               paddingTop: 12, paddingBottom: 12,
               paddingLeft: 16, paddingRight: 16,
              }}
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
