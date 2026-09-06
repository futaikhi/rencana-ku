import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle, Trash2, LogOut } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  icon?: "trash" | "logout" | "warning";
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  icon = "trash",
  loading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={title}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 bg-[#FFE4E6] border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-[#E11D48] shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {icon === "trash" ? (
              <Trash2 size={20} className="stroke-[2.5]" />
            ) : icon === "logout" ? (
              <LogOut size={20} className="stroke-[2.5]" />
            ) : (
              <AlertTriangle size={20} className="stroke-[2.5]" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-black leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-[#F0F0F0] rounded-full border-2 border-transparent hover:border-black transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5 disabled:opacity-50 ${
              variant === "danger"
                ? "bg-[#FFE4E6] hover:bg-[#ffcdd3] text-[#E11D48]"
                : "bg-[#E0FF62] hover:bg-[#d6f54c] text-black"
            }`}
          >
            {icon === "trash" ? (
              <Trash2 size={14} className="stroke-[2.5]" />
            ) : icon === "logout" ? (
              <LogOut size={14} className="stroke-[2.5]" />
            ) : (
              <AlertTriangle size={14} className="stroke-[2.5]" />
            )}
            <span>{loading ? "Processing..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
