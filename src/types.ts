export type PlanRole = "OWNER" | "EDITOR" | "VIEWER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type MilestoneStatus = "PENDING" | "COMPLETED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
}

export interface PlanMember {
  id: string;
  user_id: string;
  role: PlanRole;
  joined_at: string;
  name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

export interface PlanStats {
  totalTasks: number;
  completedTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  progress: number;
  totalEstimated: number;
  totalActual: number;
  remainingBudget: number;
  memberCount: number;
}

export interface Plan {
  id: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  target_date?: string | null;
  budget_enabled: boolean;
  budget_target?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  role?: PlanRole;
  isOwner?: boolean;
  isEditor?: boolean;
  isViewer?: boolean;
  stats?: PlanStats;
  members?: PlanMember[];
}

export interface Task {
  id: string;
  plan_id: string;
  milestone_id?: string | null;
  milestone_title?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_avatar?: string;
  plan_name?: string;
  plan_color?: string;
  plan_icon?: string;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: MilestoneStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  totalTasks?: number;
  completedTasks?: number;
  taskProgress?: number;
  plan_name?: string;
  plan_color?: string;
  plan_icon?: string;
}

export interface BudgetItem {
  id: string;
  plan_id: string;
  name: string;
  estimated_amount: number;
  actual_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanInvitation {
  id: string;
  plan_id: string;
  inviter_id: string;
  invitee_id: string;
  role: PlanRole;
  status: InvitationStatus;
  created_at: string;
  expires_at?: string;
  plan_name?: string;
  plan_description?: string;
  plan_icon?: string;
  plan_color?: string;
  plan_category?: string;
  inviter_name?: string;
  inviter_email?: string;
  inviter_avatar?: string;
  invitee_name?: string;
  invitee_email?: string;
  invitee_avatar?: string;
}

export interface Activity {
  id: string;
  plan_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  action: string;
  details?: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  plan_name?: string;
  plan_icon?: string;
  plan_color?: string;
}

export interface PlanAccess {
  hasAccess: boolean;
  role: PlanRole | null;
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canManage: boolean;
}

export interface PlanDetailResponse {
  plan: Plan;
  access: PlanAccess;
  milestones: Milestone[];
  tasks: Task[];
  budgetItems: BudgetItem[];
  members: PlanMember[];
  invitations: PlanInvitation[];
  activities: Activity[];
}

export interface PlanTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  budget_enabled: boolean;
  budget_target?: number;
  sampleMilestones: string[];
  sampleTasks: string[];
}
