import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration: number = 4000) => {
      const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showToast(message, "success", title);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showToast(message, "error", title);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showToast(message, "info", title);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Toasts View */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col space-y-2.5 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          const bgClass = isSuccess
            ? "bg-[#E0FF62] text-black"
            : isError
            ? "bg-[#FFE4E6] text-black"
            : "bg-[#FAF8F5] text-black";

          const icon = isSuccess ? (
            <div className="w-6 h-6 rounded-lg bg-black text-[#E0FF62] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 size={15} className="stroke-[3]" />
            </div>
          ) : isError ? (
            <div className="w-6 h-6 rounded-lg bg-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle size={15} className="stroke-[3]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Info size={15} className="stroke-[3]" />
            </div>
          );

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto border-2 border-black rounded-2xl p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start justify-between gap-3 transform transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgClass}`}
            >
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="mt-0.5">{icon}</div>
                <div className="min-w-0 flex-1">
                  {toast.title && (
                    <h5
                      className={`text-xs font-black uppercase tracking-wider mb-0.5 truncate ${
                        isError ? "text-[#E11D48]" : "text-black"
                      }`}
                    >
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs font-bold leading-snug break-words text-black">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 hover:bg-black/10 active:bg-black/20 rounded-lg border border-black/20 text-black shrink-0 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={13} className="stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
