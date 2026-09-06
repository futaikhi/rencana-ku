import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`relative w-full ${maxWClasses[maxWidth]} bg-white border-2 border-black rounded-[28px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden my-8`}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b-2 border-black bg-[#F0F0F0]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 block mb-0.5">
                  PlanCraft Bento Node
                </span>
                <h3 className="text-xl font-black text-black tracking-tight uppercase">{title}</h3>
                {subtitle && <p className="text-xs text-black/60 font-medium mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-black bg-white flex items-center justify-center text-black hover:bg-[#E0FF62] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                aria-label="Close"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[calc(85vh-8rem)] overflow-y-auto bg-white">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

