import React, { useState } from "react";
import { RotateCw, Check, CloudOff, AlertCircle } from "lucide-react";
import { useSyncStatus } from "../../hooks/useSyncStatus";

interface SyncButtonProps {
  id?: string;
  variant?: "pill" | "compact" | "minimal";
  showLastSync?: boolean;
  className?: string;
  onSyncComplete?: () => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  id = "btn-sync-action",
  variant = "pill",
  showLastSync = false,
  className = "",
  onSyncComplete,
}) => {
  const { isOnline, isSyncing, pendingCount, lastSyncFormatted, syncNow } = useSyncStatus();
  const [justFinished, setJustFinished] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOnline) {
      showToast("Offline: Perubahan disimpan di perangkat.");
      return;
    }
    if (isSyncing) return;

    const res = await syncNow();
    setJustFinished(true);
    showToast(res.message);
    onSyncComplete?.();
    setTimeout(() => {
      setJustFinished(false);
    }, 2500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  if (variant === "compact") {
    return (
      <div className="relative inline-block">
        <button
          id={id}
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          title={
            !isOnline
              ? "Perangkat Offline. Data tersimpan di perangkat."
              : isSyncing
              ? "Sedang menyinkronkan..."
              : `Terakhir sinkron: ${lastSyncFormatted}. Klik untuk sinkronkan.`
          }
          className={`relative p-2 rounded-xl border-2 border-black transition-all active:translate-y-0.5 shadow-[2px_2px_0px_0px_#000] ${
            !isOnline
              ? "bg-[#EAE4DC] text-[#716860] hover:bg-[#E2DAD1]"
              : pendingCount > 0
              ? "bg-[#F3C04D] text-black hover:bg-[#E8B33E]"
              : justFinished
              ? "bg-[#4E8B62] text-white"
              : "bg-white text-black hover:bg-[#F9F7F5]"
          } ${className}`}
        >
          <RotateCw
            className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
          />
          {pendingCount > 0 && !isSyncing && (
            <span
              id="sync-badge-count"
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#C45A38] text-white text-[10px] font-black rounded-full border border-black px-1"
            >
              {pendingCount}
            </span>
          )}
        </button>

        {toastMessage && (
          <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-black text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg animate-in fade-in zoom-in-95">
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        id={id}
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 text-xs font-bold transition-colors ${
          !isOnline
            ? "text-[#8E867E]"
            : isSyncing
            ? "text-[#C45A38]"
            : "text-black hover:text-[#C45A38]"
        } ${className}`}
      >
        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        <span>
          {isSyncing
            ? "Menyinkronkan..."
            : pendingCount > 0
            ? `Sync (${pendingCount})`
            : "Sync Data"}
        </span>
      </button>
    );
  }

  // Default "pill" variant
  return (
    <div className="relative inline-flex items-center">
      <button
        id={id}
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black text-xs font-black transition-all active:translate-y-0.5 shadow-[2px_2px_0px_0px_#000] ${
          !isOnline
            ? "bg-[#EAE4DC] text-[#716860] hover:bg-[#E2DAD1]"
            : pendingCount > 0
            ? "bg-[#F3C04D] text-black hover:bg-[#E8B33E]"
            : justFinished
            ? "bg-[#4E8B62] text-white"
            : "bg-white text-black hover:bg-[#F9F7F5]"
        } ${className}`}
        title={
          !isOnline
            ? "Offline. Klik untuk info."
            : `Terakhir disinkronkan: ${lastSyncFormatted}`
        }
      >
        {justFinished ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : !isOnline ? (
          <CloudOff className="w-3.5 h-3.5" />
        ) : (
          <RotateCw
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
        )}

        <span>
          {isSyncing
            ? "Menyinkronkan..."
            : justFinished
            ? "Tersinkron"
            : !isOnline
            ? "Offline (Lokal)"
            : pendingCount > 0
            ? `Sync Data (${pendingCount})`
            : "Sync Data"}
        </span>

        {showLastSync && isOnline && !isSyncing && !justFinished && (
          <span className="text-[10px] opacity-60 font-semibold border-l border-black/20 pl-1.5 ml-0.5">
            {lastSyncFormatted}
          </span>
        )}
      </button>

      {toastMessage && (
        <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-black text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg border border-white/20 animate-in fade-in zoom-in-95">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
