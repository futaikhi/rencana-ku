import {
  User,
  Plan,
  Task,
  Milestone,
  BudgetItem,
  PlanInvitation,
  PlanDetailResponse,
  Activity,
  PlanMember,
} from "../types";
import { clientStore } from "./clientStore";
import { syncService } from "./syncService";

const TOKEN_KEY = "plancraft_token";
const CURRENT_USER_ID_KEY = "plancraft_current_user_id";

let isStaticMode: boolean | null = null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("rencanaku_token");
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rencanaku_token");
  localStorage.removeItem(CURRENT_USER_ID_KEY);
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(CURRENT_USER_ID_KEY, userId);
}

export function getCurrentUserId(): string {
  const stored = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (stored) return stored;
  const token = getToken();
  if (token && token.startsWith("local_")) {
    const parts = token.split("_");
    if (parts.length >= 3) {
      return `${parts[1]}_${parts[2]}`;
    }
  }
  return "user_one_01";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackFn?: () => T | Promise<T>
): Promise<T> {
  if (isStaticMode && fallbackFn) {
    return fallbackFn();
  }

  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    // If on a static host like Cloudflare Pages / Netlify and the API route was rewritten to index.html
    if (contentType.includes("text/html") || res.status === 404) {
      if (fallbackFn) {
        isStaticMode = true;
        return fallbackFn();
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If unauthorized or bad request from a real backend, propagate error
      if (res.status === 401 || res.status === 400 || res.status === 403) {
        throw new Error(data.error || `HTTP Error ${res.status}`);
      }
      if (fallbackFn) {
        isStaticMode = true;
        return fallbackFn();
      }
      throw new Error(data.error || `HTTP Error ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    // If network failed (e.g. device offline, timeout, or backend temporarily unreachable)
    if (
      fallbackFn &&
      (err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.name === "TypeError")
    ) {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  async getDemoAccounts(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>(
      "/api/auth/demo-accounts",
      {},
      () => clientStore.getDemoAccounts()
    );
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      () => clientStore.login(email, password)
    );
    setToken(res.token);
    setCurrentUserId(res.user.id);
    return res;
  },

  async demoLogin(email: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>(
      "/api/auth/demo-login",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      () => clientStore.demoLogin(email)
    );
    setToken(res.token);
    setCurrentUserId(res.user.id);
    return res;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => clientStore.register(data)
    );
    setToken(res.token);
    setCurrentUserId(res.user.id);
    return res;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return request<{ user: User }>(
      "/api/auth/me",
      {},
      () => clientStore.getCurrentUser(getCurrentUserId())
    );
  },

  async updateProfile(data: { name: string; bio?: string; avatar_url?: string }): Promise<{ user: User }> {
    return request<{ user: User }>(
      "/api/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      () => clientStore.updateProfile(getCurrentUserId(), data)
    );
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      "/api/auth/password",
      {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      () => ({ message: "Password updated successfully" })
    );
  },

  async searchUsers(query: string): Promise<{ users: User[] }> {
    return request<{ users: User[] }>(
      `/api/auth/search?q=${encodeURIComponent(query)}`,
      {},
      () => clientStore.searchUsers(query, getCurrentUserId())
    );
  },

  // Plans
  async getPlans(): Promise<{
    myPlans: Plan[];
    sharedPlans: Plan[];
    pendingInvitations: PlanInvitation[];
    upcomingTasks: Task[];
    upcomingMilestones: Milestone[];
  }> {
    return request(
      "/api/plans",
      {},
      () => clientStore.getPlans(getCurrentUserId())
    );
  },

  async createPlan(data: {
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    target_date?: string | null;
    budget_enabled?: boolean;
    budget_target?: number;
  }): Promise<{ plan: Plan }> {
    return request<{ plan: Plan }>(
      "/api/plans",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.createPlan(getCurrentUserId(), data);
        syncService.enqueueMutation({
          type: "CREATE_PLAN",
          entityId: res.plan.id,
          payload: { ...res.plan },
        });
        return res;
      }
    );
  },

  async getPlanDetail(id: string): Promise<PlanDetailResponse> {
    return request<PlanDetailResponse>(
      `/api/plans/${id}`,
      {},
      () => clientStore.getPlanDetail(getCurrentUserId(), id)
    );
  },

  async updatePlan(id: string, data: Partial<Plan>): Promise<{ plan: Plan }> {
    return request<{ plan: Plan }>(
      `/api/plans/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.updatePlan(id, data);
        syncService.enqueueMutation({
          type: "UPDATE_PLAN",
          entityId: id,
          planId: id,
          payload: data,
        });
        return res;
      }
    );
  },

  async deletePlan(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${id}`,
      {
        method: "DELETE",
      },
      () => {
        const res = clientStore.deletePlan(id);
        syncService.enqueueMutation({
          type: "DELETE_PLAN",
          entityId: id,
          planId: id,
          payload: {},
        });
        return res;
      }
    );
  },

  async leavePlan(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${id}/leave`,
      {
        method: "POST",
      },
      () => clientStore.removeMember(getCurrentUserId())
    );
  },

  // Tasks
  async createTask(planId: string, data: Partial<Task>): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.createTask(getCurrentUserId(), planId, data);
        syncService.enqueueMutation({
          type: "CREATE_TASK",
          entityId: res.task.id,
          planId,
          payload: { ...res.task, plan_id: planId },
        });
        return res;
      }
    );
  },

  async updateTask(planId: string, taskId: string, data: Partial<Task>): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.updateTask(planId, taskId, data);
        syncService.enqueueMutation({
          type: "UPDATE_TASK",
          entityId: taskId,
          planId,
          payload: { ...data, plan_id: planId },
        });
        return res;
      }
    );
  },

  async toggleTask(planId: string, taskId: string): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks/${taskId}/toggle`,
      {
        method: "PATCH",
      },
      () => {
        const res = clientStore.toggleTask(planId, taskId);
        syncService.enqueueMutation({
          type: "TOGGLE_TASK",
          entityId: taskId,
          planId,
          payload: { status: res.task.status, plan_id: planId },
        });
        return res;
      }
    );
  },

  async deleteTask(planId: string, taskId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/tasks/${taskId}`,
      {
        method: "DELETE",
      },
      () => {
        const res = clientStore.deleteTask(planId, taskId);
        syncService.enqueueMutation({
          type: "DELETE_TASK",
          entityId: taskId,
          planId,
          payload: {},
        });
        return res;
      }
    );
  },

  // Milestones
  async createMilestone(planId: string, data: Partial<Milestone>): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.createMilestone(planId, data);
        syncService.enqueueMutation({
          type: "CREATE_MILESTONE",
          entityId: res.milestone.id,
          planId,
          payload: { ...res.milestone, plan_id: planId },
        });
        return res;
      }
    );
  },

  async updateMilestone(planId: string, milestoneId: string, data: Partial<Milestone>): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.updateMilestone(milestoneId, data);
        syncService.enqueueMutation({
          type: "UPDATE_MILESTONE",
          entityId: milestoneId,
          planId,
          payload: { ...data, plan_id: planId },
        });
        return res;
      }
    );
  },

  async toggleMilestone(planId: string, milestoneId: string): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones/${milestoneId}/toggle`,
      {
        method: "PATCH",
      },
      () => {
        const res = clientStore.toggleMilestone(milestoneId);
        syncService.enqueueMutation({
          type: "TOGGLE_MILESTONE",
          entityId: milestoneId,
          planId,
          payload: { status: res.milestone.status, plan_id: planId },
        });
        return res;
      }
    );
  },

  async deleteMilestone(planId: string, milestoneId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/milestones/${milestoneId}`,
      {
        method: "DELETE",
      },
      () => {
        const res = clientStore.deleteMilestone(milestoneId);
        syncService.enqueueMutation({
          type: "DELETE_MILESTONE",
          entityId: milestoneId,
          planId,
          payload: {},
        });
        return res;
      }
    );
  },

  // Budget
  async createBudgetItem(planId: string, data: Partial<BudgetItem>): Promise<{ item: BudgetItem }> {
    return request<{ item: BudgetItem }>(
      `/api/plans/${planId}/budget-items`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.createBudgetItem(planId, data);
        syncService.enqueueMutation({
          type: "CREATE_BUDGET_ITEM",
          entityId: res.item.id,
          planId,
          payload: { ...res.item, plan_id: planId },
        });
        return res;
      }
    );
  },

  async updateBudgetItem(planId: string, itemId: string, data: Partial<BudgetItem>): Promise<{ item: BudgetItem }> {
    return request<{ item: BudgetItem }>(
      `/api/plans/${planId}/budget-items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      () => {
        const res = clientStore.updateBudgetItem(planId, itemId, data);
        syncService.enqueueMutation({
          type: "UPDATE_BUDGET_ITEM",
          entityId: itemId,
          planId,
          payload: { ...data, plan_id: planId },
        });
        return res;
      }
    );
  },

  async deleteBudgetItem(planId: string, itemId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/budget-items/${itemId}`,
      {
        method: "DELETE",
      },
      () => {
        const res = clientStore.deleteBudgetItem(planId, itemId);
        syncService.enqueueMutation({
          type: "DELETE_BUDGET_ITEM",
          entityId: itemId,
          planId,
          payload: {},
        });
        return res;
      }
    );
  },

  // Notes
  async updateNotes(planId: string, notes: string): Promise<{ notes: string; updated_at: string }> {
    return request<{ notes: string; updated_at: string }>(
      `/api/plans/${planId}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ notes }),
      },
      () => {
        const res = clientStore.updateNotes(planId, notes);
        syncService.enqueueMutation({
          type: "UPDATE_NOTES",
          entityId: planId,
          planId,
          payload: { notes },
        });
        return res;
      }
    );
  },

  // Members
  async updateMemberRole(planId: string, memberId: string, role: string): Promise<{ member: PlanMember }> {
    return request<{ member: PlanMember }>(
      `/api/plans/${planId}/members/${memberId}`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      },
      () => clientStore.updateMemberRole(memberId, role)
    );
  },

  async removeMember(planId: string, memberId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/members/${memberId}`,
      {
        method: "DELETE",
      },
      () => clientStore.removeMember(memberId)
    );
  },

  // Invitations
  async getInvitations(): Promise<{ invitations: PlanInvitation[] }> {
    return request<{ invitations: PlanInvitation[] }>(
      "/api/invitations",
      {},
      () => clientStore.getInvitations(getCurrentUserId())
    );
  },

  async sendInvitation(planId: string, data: { email?: string; userId?: string; role: string }): Promise<{ invitation: PlanInvitation; message: string }> {
    return request<{ invitation: PlanInvitation; message: string }>(
      `/api/invitations/plans/${planId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => clientStore.sendInvitation(getCurrentUserId(), planId, data)
    );
  },

  async respondToInvitation(inviteId: string, action: "ACCEPT" | "DECLINE"): Promise<{ message: string; planId?: string }> {
    return request<{ message: string; planId?: string }>(
      `/api/invitations/${inviteId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      },
      () => clientStore.respondToInvitation(getCurrentUserId(), inviteId, action)
    );
  },

  async cancelInvitation(inviteId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/invitations/${inviteId}`,
      {
        method: "DELETE",
      },
      () => clientStore.cancelInvitation(inviteId)
    );
  },

  // Activity Feed
  async getActivityFeed(): Promise<{ activities: Activity[] }> {
    return request<{ activities: Activity[] }>(
      "/api/activity/feed",
      {},
      () => clientStore.getActivityFeed(getCurrentUserId())
    );
  },
};
