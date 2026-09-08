import { useState, useEffect, useCallback } from "react";
import { syncService } from "../lib/syncService";
import { useOnlineStatus } from "./useOnlineStatus";

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "Belum pernah";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Baru saja";
  }
}

export function useSyncStatus() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(syncService.isCurrentlySyncing());
  const [pendingCount, setPendingCount] = useState(syncService.getPendingCount());
  const [lastSyncTime, setLastSyncTime] = useState(syncService.getLastSyncTime());

  const updateState = useCallback(() => {
    setIsSyncing(syncService.isCurrentlySyncing());
    setPendingCount(syncService.getPendingCount());
    setLastSyncTime(syncService.getLastSyncTime());
  }, []);

  useEffect(() => {
    updateState();

    const handleSyncEvent = () => updateState();
    window.addEventListener("plancraft-sync-change", handleSyncEvent);
    window.addEventListener("plancraft-sync-complete", handleSyncEvent);
    window.addEventListener("focus", handleSyncEvent);

    return () => {
      window.removeEventListener("plancraft-sync-change", handleSyncEvent);
      window.removeEventListener("plancraft-sync-complete", handleSyncEvent);
      window.removeEventListener("focus", handleSyncEvent);
    };
  }, [updateState]);

  const syncNow = useCallback(async () => {
    const result = await syncService.syncNow();
    updateState();
    return result;
  }, [updateState]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    lastSyncFormatted: formatRelativeTime(lastSyncTime),
    syncNow,
  };
}
