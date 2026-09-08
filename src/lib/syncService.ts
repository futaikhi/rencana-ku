import { getToken, getCurrentUserId } from "./api";
import { clientStore } from "./clientStore";

export interface SyncMutation {
  id: string;
  type:
    | "CREATE_PLAN"
    | "UPDATE_PLAN"
    | "DELETE_PLAN"
    | "CREATE_TASK"
    | "UPDATE_TASK"
    | "DELETE_TASK"
    | "TOGGLE_TASK"
    | "CREATE_MILESTONE"
    | "UPDATE_MILESTONE"
    | "DELETE_MILESTONE"
    | "TOGGLE_MILESTONE"
    | "CREATE_BUDGET_ITEM"
    | "UPDATE_BUDGET_ITEM"
    | "DELETE_BUDGET_ITEM"
    | "UPDATE_NOTES";
  entityId: string;
  planId?: string;
  payload: any;
  createdAt: string;
}

const MUTATIONS_KEY = "plancraft_pending_mutations_v1";
const LAST_SYNC_KEY = "plancraft_last_sync_time";

let isSyncing = false;

function dispatchSyncEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("plancraft-sync-change"));
  }
}

export const syncService = {
  getPendingMutations(): SyncMutation[] {
    try {
      const raw = localStorage.getItem(MUTATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  enqueueMutation(
    mutation: Omit<SyncMutation, "id" | "createdAt">
  ): SyncMutation {
    const list = this.getPendingMutations();
    const newMutation: SyncMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // Replace redundant updates for the same entity if applicable
    const filtered = list.filter(
      (m) =>
        !(
          m.entityId === newMutation.entityId &&
          m.type === newMutation.type &&
          (newMutation.type.startsWith("UPDATE_") || newMutation.type === "UPDATE_NOTES")
        )
    );

    filtered.push(newMutation);
    localStorage.setItem(MUTATIONS_KEY, JSON.stringify(filtered));
    dispatchSyncEvent();
    return newMutation;
  },

  clearMutations() {
    localStorage.removeItem(MUTATIONS_KEY);
    dispatchSyncEvent();
  },

  getPendingCount(): number {
    return this.getPendingMutations().length;
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  setLastSyncTime(timeIso: string) {
    localStorage.setItem(LAST_SYNC_KEY, timeIso);
    dispatchSyncEvent();
  },

  isCurrentlySyncing(): boolean {
    return isSyncing;
  },

  /**
   * Main sync trigger:
   * 1. Triggered on app mount (if online)
   * 2. Triggered on manual click of "Sync Data" button
   * Strictly NO background timer loops.
   */
  async syncNow(): Promise<{
    success: boolean;
    appliedCount: number;
    message: string;
  }> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        success: false,
        appliedCount: 0,
        message: "Perangkat sedang offline. Perubahan tersimpan di perangkat.",
      };
    }

    const token = getToken();
    if (!token) {
      return {
        success: false,
        appliedCount: 0,
        message: "Belum login. Data disimpan secara lokal.",
      };
    }

    if (isSyncing) {
      return {
        success: false,
        appliedCount: 0,
        message: "Sinkronisasi sedang berlangsung...",
      };
    }

    isSyncing = true;
    dispatchSyncEvent();

    try {
      const mutations = this.getPendingMutations();

      // 1. Post pending offline mutations to the server
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const appliedCount = data.appliedCount || 0;

      // Clear synced mutations
      this.clearMutations();

      // Update timestamp
      const now = new Date().toISOString();
      this.setLastSyncTime(now);

      // 2. Fetch fresh plans to ensure local cache is completely synchronized
      try {
        const freshPlansRes = await fetch("/api/plans", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (freshPlansRes.ok) {
          const freshData = await freshPlansRes.json();
          if (freshData.myPlans) {
            // Also update clientStore local backup so offline view is immediately fresh
            const localState = clientStore.loadRawState?.();
            if (localState) {
              const currentUserId = getCurrentUserId();
              const nonUserPlans = localState.plans.filter(
                (p: any) => p.owner_id !== currentUserId
              );
              localState.plans = [...freshData.myPlans, ...nonUserPlans];
              clientStore.saveRawState?.(localState);
            }
          }
        }
      } catch (pullErr) {
        console.warn("Pulling fresh plans warning:", pullErr);
      }

      window.dispatchEvent(new CustomEvent("plancraft-sync-complete", { detail: { appliedCount } }));

      return {
        success: true,
        appliedCount,
        message:
          appliedCount > 0
            ? `Berhasil menyinkronkan ${appliedCount} perubahan!`
            : "Semua data telah sinkron.",
      };
    } catch (err: any) {
      console.warn("Sync execution failed:", err);
      return {
        success: false,
        appliedCount: 0,
        message: err.message || "Gagal menyinkronkan data.",
      };
    } finally {
      isSyncing = false;
      dispatchSyncEvent();
    }
  },
};
