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

const INITIAL_USERS: (User & { password?: string })[] = [
  {
    id: "user_one_01",
    name: "User One",
    email: "user1@plancraft.app",
    password: "password123",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Primary Planner (Demo 1)",
  },
  {
    id: "user_two_02",
    name: "User Two",
    email: "user2@plancraft.app",
    password: "password123",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Collaborator (Demo 2)",
  },
];

const INITIAL_PLANS: Plan[] = [
  {
    id: "plan_wedding_01",
    owner_id: "user_one_01",
    name: "Wedding Celebration",
    description: "Our dream garden wedding celebration with close friends and family in Bandung.",
    category: "Wedding",
    icon: "HeartHandshake",
    color: "#C45A38",
    target_date: "2027-12-18",
    budget_enabled: true,
    budget_target: 75000000,
    notes: "Notes for the wedding:\n- Preferred venue ambiance: Rustic botanical garden with evening fairy lights.\n- Colors: Terracotta, sage green, and warm cream.\n- Guest list cap: 150 intimate guests.\n- Special dietary requests: 12 vegetarian options.",
    owner_name: "User One",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      totalTasks: 4,
      completedTasks: 2,
      totalMilestones: 2,
      completedMilestones: 1,
      progress: 50,
      totalEstimated: 53000000,
      totalActual: 22500000,
      remainingBudget: 52500000,
      memberCount: 2,
    },
  },
  {
    id: "plan_house_02",
    owner_id: "user_one_01",
    name: "Build Modern Minimalist House",
    description: "Architectural design, land survey, contractor selection, and building phase.",
    category: "Home",
    icon: "Home",
    color: "#2B4C7E",
    target_date: "2028-06-30",
    budget_enabled: true,
    budget_target: 650000000,
    notes: "Project Details:\n- Plot size: 180 sqm, 2-story building with inner courtyard.\n- Sustainable features: Solar-ready roof and rainwater harvesting.",
    owner_name: "User One",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      totalTasks: 3,
      completedTasks: 1,
      totalMilestones: 2,
      completedMilestones: 0,
      progress: 33,
      totalEstimated: 120000000,
      totalActual: 70000000,
      remainingBudget: 580000000,
      memberCount: 1,
    },
  },
  {
    id: "plan_trip_03",
    owner_id: "user_two_02",
    name: "Japan Autumn Odyssey",
    description: "Tokyo, Kyoto, and Takayama autumn foliage exploration with culinary walks.",
    category: "Vacation",
    icon: "Plane",
    color: "#B8731F",
    target_date: "2027-10-25",
    budget_enabled: true,
    budget_target: 30000000,
    notes: "Trip Highlights:\n- Tokyo: Shinjuku Gyoen foliage, Akihabara, Tsukiji Outer Market.\n- Kyoto: Arashiyama bamboo grove at sunrise, Fushimi Inari night hike.\n- Takayama: Hida beef tasting & traditional Machiya stay.",
    owner_name: "User Two",
    owner_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      totalTasks: 3,
      completedTasks: 1,
      totalMilestones: 2,
      completedMilestones: 0,
      progress: 33,
      totalEstimated: 15000000,
      totalActual: 4200000,
      remainingBudget: 25800000,
      memberCount: 2,
    },
  },
  {
    id: "plan_study_04",
    owner_id: "user_one_01",
    name: "Master Japanese for JLPT N3",
    description: "Systematic self-study plan to achieve conversational fluency and pass the JLPT N3 exam.",
    category: "Education",
    icon: "GraduationCap",
    color: "#5A67D8",
    target_date: "2027-07-04",
    budget_enabled: false,
    budget_target: 0,
    notes: "Study Strategy:\n- Daily: 30 minutes Anki spaced repetition for Kanji and vocabulary.\n- Weekly: 2 grammar chapters in Tobira / Genki II.\n- Immersion: Listen to Japanese podcasts during commute.",
    owner_name: "User One",
    owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      totalTasks: 5,
      completedTasks: 2,
      totalMilestones: 3,
      completedMilestones: 1,
      progress: 40,
      totalEstimated: 0,
      totalActual: 0,
      remainingBudget: 0,
      memberCount: 1,
    },
  },
];

const INITIAL_MEMBERS: StoredMember[] = [
  {
    id: "pm_wed_1",
    plan_id: "plan_wedding_01",
    user_id: "user_one_01",
    role: "OWNER",
    joined_at: new Date().toISOString(),
    name: "User One",
    email: "user1@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Primary Planner (Demo 1)",
  },
  {
    id: "pm_wed_2",
    plan_id: "plan_wedding_01",
    user_id: "user_two_02",
    role: "EDITOR",
    joined_at: new Date().toISOString(),
    name: "User Two",
    email: "user2@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Collaborator (Demo 2)",
  },
  {
    id: "pm_house_1",
    plan_id: "plan_house_02",
    user_id: "user_one_01",
    role: "OWNER",
    joined_at: new Date().toISOString(),
    name: "User One",
    email: "user1@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "pm_trip_1",
    plan_id: "plan_trip_03",
    user_id: "user_two_02",
    role: "OWNER",
    joined_at: new Date().toISOString(),
    name: "User Two",
    email: "user2@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "pm_trip_2",
    plan_id: "plan_trip_03",
    user_id: "user_one_01",
    role: "EDITOR",
    joined_at: new Date().toISOString(),
    name: "User One",
    email: "user1@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "pm_study_1",
    plan_id: "plan_study_04",
    user_id: "user_one_01",
    role: "OWNER",
    joined_at: new Date().toISOString(),
    name: "User One",
    email: "user1@plancraft.app",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
];

const INITIAL_MILESTONES: Milestone[] = [
  {
    id: "ms_wed_1",
    plan_id: "plan_wedding_01",
    title: "Venue & Guest List Finalization",
    description: "Secure garden location and send save-the-date cards.",
    target_date: "2027-02-28",
    status: "COMPLETED",
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    totalTasks: 3,
    completedTasks: 2,
    taskProgress: 67,
  },
  {
    id: "ms_wed_2",
    plan_id: "plan_wedding_01",
    title: "Catering & Attire Selection",
    description: "Food tasting session and fitting custom terracotta bridal wear.",
    target_date: "2027-06-30",
    status: "PENDING",
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    totalTasks: 1,
    completedTasks: 0,
    taskProgress: 0,
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "t_wed_1",
    plan_id: "plan_wedding_01",
    milestone_id: "ms_wed_1",
    title: "Survey 3 botanical garden venues in Bandung",
    description: "Check capacity, rainy season backup tent, and parking access.",
    status: "COMPLETED",
    priority: "HIGH",
    due_date: "2027-01-15",
    assignee_id: "user_one_01",
    assignee_name: "User One",
    created_by: "user_one_01",
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t_wed_2",
    plan_id: "plan_wedding_01",
    milestone_id: "ms_wed_1",
    title: "Finalize master invitation list to 150 guests",
    description: "Consolidate contacts from family and friends.",
    status: "COMPLETED",
    priority: "MEDIUM",
    due_date: "2027-01-30",
    assignee_id: "user_two_02",
    assignee_name: "User Two",
    created_by: "user_one_01",
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t_wed_3",
    plan_id: "plan_wedding_01",
    milestone_id: "ms_wed_1",
    title: "Sign venue contract and pay deposit",
    description: "Booking locked for December 18th.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    due_date: "2027-02-15",
    assignee_id: "user_one_01",
    assignee_name: "User One",
    created_by: "user_one_01",
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t_wed_4",
    plan_id: "plan_wedding_01",
    milestone_id: "ms_wed_2",
    title: "Catering food tasting for 5 menu packages",
    description: "Test Nusantara fusion and vegetarian selections.",
    status: "TODO",
    priority: "HIGH",
    due_date: "2027-04-10",
    assignee_id: "user_two_02",
    assignee_name: "User Two",
    created_by: "user_one_01",
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: "b_wed_1",
    plan_id: "plan_wedding_01",
    name: "Garden Venue Rental & Outdoor Lights",
    estimated_amount: 25000000,
    actual_amount: 22500000,
    notes: "30% initial deposit paid, balance due 2 weeks before event.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "b_wed_2",
    plan_id: "plan_wedding_01",
    name: "Catering Buffet & Stalls for 150 Guests",
    estimated_amount: 28000000,
    actual_amount: 0,
    notes: "Price includes service staff and welcome drinks.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_INVITATIONS: PlanInvitation[] = [
  {
    id: "inv_saas_user1",
    plan_id: "plan_saas_05",
    inviter_id: "user_two_02",
    invitee_id: "user_one_01",
    role: "EDITOR",
    status: "PENDING",
    created_at: new Date().toISOString(),
    plan_name: "Launch PlanCraft SaaS",
    plan_icon: "Rocket",
    plan_color: "#0F766E",
    inviter_name: "User Two",
    inviter_email: "user2@plancraft.app",
    inviter_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    invitee_name: "User One",
    invitee_email: "user1@plancraft.app",
  },
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "act_1",
    plan_id: "plan_wedding_01",
    actor_id: "user_one_01",
    action: "created_plan",
    details: 'created the Plan "Wedding Celebration"',
    entity_type: "plan",
    entity_id: "plan_wedding_01",
    created_at: new Date().toISOString(),
    actor_name: "User One",
    actor_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    plan_name: "Wedding Celebration",
    plan_color: "#C45A38",
  },
  {
    id: "act_2",
    plan_id: "plan_wedding_01",
    actor_id: "user_one_01",
    action: "invited_member",
    details: "invited User Two as an Editor",
    entity_type: "member",
    created_at: new Date().toISOString(),
    actor_name: "User One",
    actor_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    plan_name: "Wedding Celebration",
    plan_color: "#C45A38",
  },
];

function getInitialState(): LocalState {
  return {
    users: INITIAL_USERS,
    plans: INITIAL_PLANS,
    members: INITIAL_MEMBERS,
    milestones: INITIAL_MILESTONES,
    tasks: INITIAL_TASKS,
    budgetItems: INITIAL_BUDGET_ITEMS,
    invitations: INITIAL_INVITATIONS,
    activities: INITIAL_ACTIVITIES,
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
  getDemoAccounts(): { users: User[] } {
    const state = loadState();
    return {
      users: state.users.map(({ password, ...u }) => u),
    };
  },

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

  demoLogin(email: string): { user: User; token: string } {
    const state = loadState();
    const found = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error("Demo user not found");
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
};
