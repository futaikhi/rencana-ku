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

const TOKEN_KEY = "plancraft_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("rencanaku_token");
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("rencanaku_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, { ...options, headers });
  } catch {
    throw new Error("A network connection is required to use PlanCraft.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    setToken(res.token);
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
      });
    setToken(res.token);
    return res;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return request<{ user: User }>(
      "/api/auth/me",
      {});
  },

  async updateProfile(data: { name: string; bio?: string; avatar_url?: string }): Promise<{ user: User }> {
    return request<{ user: User }>(
      "/api/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      "/api/auth/password",
      {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
  },

  async searchUsers(query: string): Promise<{ users: User[] }> {
    return request<{ users: User[] }>(
      `/api/auth/search?q=${encodeURIComponent(query)}`,
      {});
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
      {});
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
      });
  },

  async getPlanDetail(id: string): Promise<PlanDetailResponse> {
    return request<PlanDetailResponse>(
      `/api/plans/${id}`,
      {});
  },

  async updatePlan(id: string, data: Partial<Plan>): Promise<{ plan: Plan }> {
    return request<{ plan: Plan }>(
      `/api/plans/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      });
  },

  async deletePlan(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${id}`,
      {
        method: "DELETE",
      });
  },

  async leavePlan(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${id}/leave`,
      {
        method: "POST",
      });
  },

  // Tasks
  async createTask(planId: string, data: Partial<Task>): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      });
  },

  async updateTask(planId: string, taskId: string, data: Partial<Task>): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      });
  },

  async toggleTask(planId: string, taskId: string): Promise<{ task: Task }> {
    return request<{ task: Task }>(
      `/api/plans/${planId}/tasks/${taskId}/toggle`,
      {
        method: "PATCH",
      });
  },

  async deleteTask(planId: string, taskId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/tasks/${taskId}`,
      {
        method: "DELETE",
      });
  },

  // Milestones
  async createMilestone(planId: string, data: Partial<Milestone>): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones`,
      {
        method: "POST",
        body: JSON.stringify(data),
      });
  },

  async updateMilestone(planId: string, milestoneId: string, data: Partial<Milestone>): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      });
  },

  async toggleMilestone(planId: string, milestoneId: string): Promise<{ milestone: Milestone }> {
    return request<{ milestone: Milestone }>(
      `/api/plans/${planId}/milestones/${milestoneId}/toggle`,
      {
        method: "PATCH",
      });
  },

  async deleteMilestone(planId: string, milestoneId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/milestones/${milestoneId}`,
      {
        method: "DELETE",
      });
  },

  // Budget
  async createBudgetItem(planId: string, data: Partial<BudgetItem>): Promise<{ item: BudgetItem }> {
    return request<{ item: BudgetItem }>(
      `/api/plans/${planId}/budget-items`,
      {
        method: "POST",
        body: JSON.stringify(data),
      });
  },

  async updateBudgetItem(planId: string, itemId: string, data: Partial<BudgetItem>): Promise<{ item: BudgetItem }> {
    return request<{ item: BudgetItem }>(
      `/api/plans/${planId}/budget-items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      });
  },

  async deleteBudgetItem(planId: string, itemId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/budget-items/${itemId}`,
      {
        method: "DELETE",
      });
  },

  // Notes
  async updateNotes(planId: string, notes: string): Promise<{ notes: string; updated_at: string }> {
    return request<{ notes: string; updated_at: string }>(
      `/api/plans/${planId}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ notes }),
      });
  },

  // Members
  async updateMemberRole(planId: string, memberId: string, role: string): Promise<{ member: PlanMember }> {
    return request<{ member: PlanMember }>(
      `/api/plans/${planId}/members/${memberId}`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
  },

  async removeMember(planId: string, memberId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/plans/${planId}/members/${memberId}`,
      {
        method: "DELETE",
      });
  },

  // Invitations
  async getInvitations(): Promise<{ invitations: PlanInvitation[] }> {
    return request<{ invitations: PlanInvitation[] }>(
      "/api/invitations",
      {});
  },

  async sendInvitation(planId: string, data: { email?: string; userId?: string; role: string }): Promise<{ invitation: PlanInvitation; message: string }> {
    return request<{ invitation: PlanInvitation; message: string }>(
      `/api/invitations/plans/${planId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      });
  },

  async respondToInvitation(inviteId: string, action: "ACCEPT" | "DECLINE"): Promise<{ message: string; planId?: string }> {
    return request<{ message: string; planId?: string }>(
      `/api/invitations/${inviteId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      });
  },

  async cancelInvitation(inviteId: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/api/invitations/${inviteId}`,
      {
        method: "DELETE",
      });
  },

  // Activity Feed
  async getActivityFeed(): Promise<{ activities: Activity[] }> {
    return request<{ activities: Activity[] }>(
      "/api/activity/feed",
      {});
  },
};
