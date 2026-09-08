import React from "react";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { WifiOff, CloudUpload, RotateCw } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useSyncStatus();

  // If online and nothing is pending to sync and not syncing, hide banner
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  // Offline state banner
  if (!isOnline) {
    return (
      <div
        id="offline-status-banner"
        role="status"
        aria-live="polite"
        className="fixed bottom-16 sm:bottom-6 left-4 z-50 flex items-center space-x-2 bg-[#F59E0B] text-black border-2 border-black px-3.5 py-2 rounded-2xl text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="p-1 bg-white border border-black rounded-lg">
          <WifiOff size={14} className="stroke-[3] text-black" />
        </div>
        <span>
          {pendingCount > 0
            ? `Offline — ${pendingCount} perubahan tersimpan di perangkat`
            : "Mode Offline — Data tersimpan di perangkat"}
        </span>
        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
      </div>
    );
  }

  // Online with pending changes ready to be synced manually
  return (
    <div
      id="pending-sync-banner"
      role="status"
      aria-live="polite"
      className="fixed bottom-16 sm:bottom-6 left-4 z-50 flex items-center space-x-2.5 bg-[#E0FF62] text-black border-2 border-black px-3.5 py-2 rounded-2xl text-xs font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="p-1 bg-white border border-black rounded-lg">
        {isSyncing ? (
          <RotateCw size={14} className="stroke-[3] text-black animate-spin" />
        ) : (
          <CloudUpload size={14} className="stroke-[3] text-black" />
        )}
      </div>
      <span>
        {isSyncing
          ? "Menyinkronkan data..."
          : `Kembali Online — Ada ${pendingCount} perubahan`}
      </span>
      {!isSyncing && (
        <button
          type="button"
          onClick={() => syncNow()}
          className="ml-1 px-2.5 py-1 bg-black text-white text-[11px] font-black uppercase rounded-lg hover:bg-neutral-800 active:scale-95 transition-all"
        >
          Sync Sekarang
        </button>
      )}
    </div>
  );
};
