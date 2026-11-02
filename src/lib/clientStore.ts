import {
  User,
  Plan,
  PlanDetailResponse,
  Task,
  Milestone,
  BudgetItem,
  PlanMember,
  PlanInvitation,
  Activity,
  PlanAccess,
  PlanStats,
} from "../types";

const STORAGE_KEY = "plancraft_local_state_v1";

interface StoredMember extends PlanMember {
  plan_id: string;
}

interface LocalState {
  users: (User & { password?: string })[];
  plans: Plan[];
  members: StoredMember[];
  milestones: Milestone[];
  tasks: Task[];
  budgetItems: BudgetItem[];
  invitations: PlanInvitation[];
  activities: Activity[];
}

function getInitialState(): LocalState {
  return {
    users: [],
    plans: [],
    members: [],
    milestones: [],
    tasks: [],
    budgetItems: [],
    invitations: [],
    activities: [],
  };
}

function loadState(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      saveState(init);
      return init;
    }
    return JSON.parse(raw);
  } catch {
    const init = getInitialState();
    saveState(init);
    return init;
  }
}

function saveState(state: LocalState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save local state:", err);
  }
}

function calculatePlanStats(state: LocalState, planId: string): PlanStats {
  const plan = state.plans.find((p) => p.id === planId);
  const tasks = state.tasks.filter((t) => t.plan_id === planId);
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const milestones = state.milestones.filter((m) => m.plan_id === planId);
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED");
  const members = state.members.filter((m) => m.plan_id === planId);
  const budgetItems = state.budgetItems.filter((b) => b.plan_id === planId);

  const totalEstimated = budgetItems.reduce((acc, b) => acc + (b.estimated_amount || 0), 0);
  const totalActual = budgetItems.reduce((acc, b) => acc + (b.actual_amount || 0), 0);
  const budgetTarget = plan?.budget_target || 0;
  const remainingBudget = Math.max(0, budgetTarget - totalActual);
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    totalMilestones: milestones.length,
    completedMilestones: completedMilestones.length,
    progress,
    totalEstimated,
    totalActual,
    remainingBudget,
    memberCount: members.length,
  };
}

export const clientStore = {
  login(email: string, pass: string): { user: User; token: string } {
    const state = loadState();
    const found = state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && (!u.password || u.password === pass)
    );
    if (!found) {
      throw new Error("Invalid email or password");
    }
    const { password, ...user } = found;
    const token = `local_${user.id}_${Date.now()}`;
    return { user, token };
  },

  register(data: { name: string; email: string; password: string; bio?: string }): {
    user: User;
    token: string;
  } {
    const state = loadState();
    if (state.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("Email is already registered");
    }
    const newUser: User & { password?: string } = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password,
      bio: data.bio || "PlanCraft Explorer",
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
    };
    state.users.push(newUser);
    saveState(state);
    const { password, ...user } = newUser;
    const token = `local_${user.id}_${Date.now()}`;
    return { user, token };
  },

  getCurrentUser(userId: string): { user: User } {
    const state = loadState();
    const found = state.users.find((u) => u.id === userId);
    if (!found) {
      throw new Error("User not found");
    }
    const { password, ...user } = found;
    return { user };
  },

  updateProfile(userId: string, data: { name: string; bio?: string; avatar_url?: string }): { user: User } {
    const state = loadState();
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (data.name) user.name = data.name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.avatar_url) user.avatar_url = data.avatar_url;
    saveState(state);
    const { password, ...safeUser } = user;
    return { user: safeUser };
  },

  searchUsers(query: string, excludeUserId: string): { users: User[] } {
    const state = loadState();
    const q = query.toLowerCase();
    const results = state.users
      .filter((u) => u.id !== excludeUserId && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
      .map(({ password, ...u }) => u);
    return { users: results };
  },

  getPlans(userId: string) {
    const state = loadState();
    const myPlans = state.plans.filter((p) => p.owner_id === userId);
    const memberPlanIds = state.members
      .filter((m) => m.user_id === userId && m.role !== "OWNER")
      .map((m) => m.plan_id);
    const sharedPlans = state.plans.filter((p) => memberPlanIds.includes(p.id));
    const pendingInvitations = state.invitations.filter(
      (inv) => inv.invitee_id === userId && inv.status === "PENDING"
    );
    const userPlanIds = [...myPlans.map((p) => p.id), ...sharedPlans.map((p) => p.id)];
    const upcomingTasks = state.tasks
      .filter((t) => userPlanIds.includes(t.plan_id) && t.status !== "COMPLETED")
      .slice(0, 10);
    const upcomingMilestones = state.milestones
      .filter((m) => userPlanIds.includes(m.plan_id) && m.status !== "COMPLETED")
      .slice(0, 5);

    // Attach stats
    for (const p of myPlans) {
      p.stats = calculatePlanStats(state, p.id);
    }
    for (const p of sharedPlans) {
      p.stats = calculatePlanStats(state, p.id);
    }

    return {
      myPlans,
      sharedPlans,
      pendingInvitations,
      upcomingTasks,
      upcomingMilestones,
    };
  },

  createPlan(userId: string, data: Partial<Plan>): { plan: Plan } {
    const state = loadState();
    const user = state.users.find((u) => u.id === userId);
    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      owner_id: userId,
      name: data.name || "Untitled Plan",
      description: data.description || "",
      category: data.category || "General",
      icon: data.icon || "Sparkles",
      color: data.color || "#0F766E",
      target_date: data.target_date || undefined,
      budget_enabled: !!data.budget_enabled,
      budget_target: data.budget_target || 0,
      notes: "",
      owner_name: user?.name || "User",
      owner_avatar: user?.avatar_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        progress: 0,
        totalEstimated: 0,
        totalActual: 0,
        remainingBudget: data.budget_target || 0,
        memberCount: 1,
      },
    };
    state.plans.unshift(newPlan);
    state.members.push({
      id: `pm_${Date.now()}`,
      plan_id: newPlan.id,
      user_id: userId,
      role: "OWNER",
      joined_at: new Date().toISOString(),
      name: user?.name || "User",
      email: user?.email,
      avatar_url: user?.avatar_url,
    });
    saveState(state);
    return { plan: newPlan };
  },

  getPlanDetail(userId: string, planId: string): PlanDetailResponse {
    const state = loadState();
    const plan = state.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    const member = state.members.find((m) => m.plan_id === planId && m.user_id === userId);
    const isOwner = plan.owner_id === userId;
    const role = isOwner ? "OWNER" : member?.role || "VIEWER";
    const canEdit = isOwner || role === "EDITOR";
    const canManage = isOwner;

    const access: PlanAccess = {
      hasAccess: true,
      role,
      isOwner,
      isEditor: role === "EDITOR",
      isViewer: role === "VIEWER",
      canEdit,
      canManage,
    };

    plan.stats = calculatePlanStats(state, planId);

    const milestones = state.milestones.filter((m) => m.plan_id === planId);
    const tasks = state.tasks.filter((t) => t.plan_id === planId);
    const budgetItems = state.budgetItems.filter((b) => b.plan_id === planId);
    const members = state.members.filter((m) => m.plan_id === planId);
    const invitations = isOwner
      ? state.invitations.filter((i) => i.plan_id === planId && i.status === "PENDING")
      : [];
    const activities = state.activities.filter((a) => a.plan_id === planId).slice(0, 30);

    return {
      plan,
      access,
      milestones,
      tasks,
      budgetItems,
      members,
      invitations,
      activities,
    };
  },

  updatePlan(planId: string, data: Partial<Plan>): { plan: Plan } {
    const state = loadState();
    const plan = state.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    Object.assign(plan, data, { updated_at: new Date().toISOString() });
    plan.stats = calculatePlanStats(state, planId);
    saveState(state);
    return { plan };
  },

  deletePlan(planId: string): { message: string } {
    const state = loadState();
    state.plans = state.plans.filter((p) => p.id !== planId);
    state.members = state.members.filter((m) => m.plan_id !== planId);
    state.milestones = state.milestones.filter((m) => m.plan_id !== planId);
    state.tasks = state.tasks.filter((t) => t.plan_id !== planId);
    state.budgetItems = state.budgetItems.filter((b) => b.plan_id !== planId);
    state.invitations = state.invitations.filter((i) => i.plan_id !== planId);
    saveState(state);
    return { message: "Plan deleted" };
  },

  createTask(userId: string, planId: string, data: Partial<Task>): { task: Task } {
    const state = loadState();
    const user = state.users.find((u) => u.id === (data.assignee_id || userId));
    const newTask: Task = {
      id: `task_${Date.now()}`,
      plan_id: planId,
      milestone_id: data.milestone_id || null,
      title: data.title || "New Task",
      description: data.description || "",
      status: data.status || "TODO",
      priority: data.priority || "MEDIUM",
      due_date: data.due_date || undefined,
      assignee_id: data.assignee_id || null,
      assignee_name: user?.name,
      created_by: userId,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.tasks.push(newTask);
    saveState(state);
    return { task: newTask };
  },

  updateTask(planId: string, taskId: string, data: Partial<Task>): { task: Task } {
    const state = loadState();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    Object.assign(task, data, { updated_at: new Date().toISOString() });
    if (data.assignee_id) {
      const user = state.users.find((u) => u.id === data.assignee_id);
      task.assignee_name = user?.name;
    }
    saveState(state);
    return { task };
  },

  toggleTask(planId: string, taskId: string): { task: Task } {
    const state = loadState();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    task.status = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    task.updated_at = new Date().toISOString();
    saveState(state);
    return { task };
  },

  deleteTask(planId: string, taskId: string): { message: string } {
    const state = loadState();
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    saveState(state);
    return { message: "Task deleted" };
  },

  createMilestone(planId: string, data: Partial<Milestone>): { milestone: Milestone } {
    const state = loadState();
    const newMs: Milestone = {
      id: `ms_${Date.now()}`,
      plan_id: planId,
      title: data.title || "New Milestone",
      description: data.description || "",
      target_date: data.target_date || undefined,
      status: "PENDING",
      sort_order: state.milestones.filter((m) => m.plan_id === planId).length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      totalTasks: 0,
      completedTasks: 0,
      taskProgress: 0,
    };
    state.milestones.push(newMs);
    saveState(state);
    return { milestone: newMs };
  },

  updateMilestone(milestoneId: string, data: Partial<Milestone>): { milestone: Milestone } {
    const state = loadState();
    const ms = state.milestones.find((m) => m.id === milestoneId);
    if (!ms) throw new Error("Milestone not found");
    Object.assign(ms, data, { updated_at: new Date().toISOString() });
    saveState(state);
    return { milestone: ms };
  },

  toggleMilestone(milestoneId: string): { milestone: Milestone } {
    const state = loadState();
    const ms = state.milestones.find((m) => m.id === milestoneId);
    if (!ms) throw new Error("Milestone not found");
    ms.status = ms.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    ms.updated_at = new Date().toISOString();
    saveState(state);
    return { milestone: ms };
  },

  deleteMilestone(milestoneId: string): { message: string } {
    const state = loadState();
    state.milestones = state.milestones.filter((m) => m.id !== milestoneId);
    saveState(state);
    return { message: "Milestone deleted" };
  },

  createBudgetItem(planId: string, data: Partial<BudgetItem>): { item: BudgetItem } {
    const state = loadState();
    const newItem: BudgetItem = {
      id: `b_${Date.now()}`,
      plan_id: planId,
      name: data.name || "Budget item",
      estimated_amount: Number(data.estimated_amount) || 0,
      actual_amount: Number(data.actual_amount) || 0,
      notes: data.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.budgetItems.push(newItem);
    saveState(state);
    return { item: newItem };
  },

  updateBudgetItem(planId: string, itemId: string, data: Partial<BudgetItem>): { item: BudgetItem } {
    const state = loadState();
    const item = state.budgetItems.find((b) => b.id === itemId);
    if (!item) throw new Error("Budget item not found");
    Object.assign(item, data, { updated_at: new Date().toISOString() });
    saveState(state);
    return { item };
  },

  deleteBudgetItem(planId: string, itemId: string): { message: string } {
    const state = loadState();
    state.budgetItems = state.budgetItems.filter((b) => b.id !== itemId);
    saveState(state);
    return { message: "Budget item deleted" };
  },

  updateNotes(planId: string, notes: string): { notes: string; updated_at: string } {
    const state = loadState();
    const plan = state.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    plan.notes = notes;
    plan.updated_at = new Date().toISOString();
    saveState(state);
    return { notes, updated_at: plan.updated_at };
  },

  updateMemberRole(memberId: string, role: string): { member: PlanMember } {
    const state = loadState();
    const mem = state.members.find((m) => m.id === memberId);
    if (!mem) throw new Error("Member not found");
    mem.role = role as any;
    saveState(state);
    return { member: mem };
  },

  removeMember(memberId: string): { message: string } {
    const state = loadState();
    state.members = state.members.filter((m) => m.id !== memberId);
    saveState(state);
    return { message: "Member removed" };
  },

  getInvitations(userId: string): { invitations: PlanInvitation[] } {
    const state = loadState();
    return {
      invitations: state.invitations.filter((i) => i.invitee_id === userId && i.status === "PENDING"),
    };
  },

  sendInvitation(inviterId: string, planId: string, data: { email?: string; userId?: string; role: string }): {
    invitation: PlanInvitation;
    message: string;
  } {
    const state = loadState();
    const plan = state.plans.find((p) => p.id === planId);
    const inviter = state.users.find((u) => u.id === inviterId);
    const target = state.users.find(
      (u) =>
        (data.userId && u.id === data.userId) ||
        (data.email && u.email.toLowerCase() === data.email.toLowerCase())
    );
    if (!target) {
      throw new Error("Target user not found");
    }
    const newInv: PlanInvitation = {
      id: `inv_${Date.now()}`,
      plan_id: planId,
      inviter_id: inviterId,
      invitee_id: target.id,
      role: (data.role || "EDITOR") as any,
      status: "PENDING",
      created_at: new Date().toISOString(),
      plan_name: plan?.name,
      plan_icon: plan?.icon,
      plan_color: plan?.color,
      inviter_name: inviter?.name,
      inviter_email: inviter?.email,
      inviter_avatar: inviter?.avatar_url,
      invitee_name: target.name,
      invitee_email: target.email,
    };
    state.invitations.push(newInv);
    saveState(state);
    return { invitation: newInv, message: "Invitation sent" };
  },

  respondToInvitation(userId: string, inviteId: string, action: "ACCEPT" | "DECLINE"): {
    message: string;
    planId?: string;
  } {
    const state = loadState();
    const inv = state.invitations.find((i) => i.id === inviteId);
    if (!inv) throw new Error("Invitation not found");
    inv.status = action === "ACCEPT" ? "ACCEPTED" : "DECLINED";

    if (action === "ACCEPT") {
      const user = state.users.find((u) => u.id === userId);
      state.members.push({
        id: `pm_${Date.now()}`,
        plan_id: inv.plan_id,
        user_id: userId,
        role: inv.role,
        joined_at: new Date().toISOString(),
        name: user?.name || "User",
        email: user?.email,
        avatar_url: user?.avatar_url,
      });
    }
    saveState(state);
    return { message: `Invitation ${action.toLowerCase()}ed`, planId: inv.plan_id };
  },

  cancelInvitation(inviteId: string): { message: string } {
    const state = loadState();
    state.invitations = state.invitations.filter((i) => i.id !== inviteId);
    saveState(state);
    return { message: "Invitation cancelled" };
  },

  getActivityFeed(userId: string): { activities: Activity[] } {
    const state = loadState();
    const myPlanIds = state.plans.filter((p) => p.owner_id === userId).map((p) => p.id);
    const memberPlanIds = state.members.filter((m) => m.user_id === userId).map((m) => m.plan_id);
    const visiblePlanIds = new Set([...myPlanIds, ...memberPlanIds]);
    return {
      activities: state.activities.filter((a) => visiblePlanIds.has(a.plan_id)),
    };
  },

  loadRawState(): LocalState {
    return loadState();
  },

  saveRawState(state: LocalState) {
    saveState(state);
  },
};
