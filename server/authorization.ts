import { queryOne, execute } from "./db.js";

export type PlanRole = "OWNER" | "EDITOR" | "VIEWER";

export interface PlanAccess {
  hasAccess: boolean;
  role: PlanRole | null;
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canManage: boolean;
}

export function getPlanAccess(userId: string, planId: string): PlanAccess {
  const plan = queryOne<{ id: string; owner_id: string }>(
    "SELECT id, owner_id FROM plans WHERE id = ?",
    [planId]
  );

  if (!plan) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      isEditor: false,
      isViewer: false,
      canEdit: false,
      canManage: false,
    };
  }

  // Check if direct owner
  if (plan.owner_id === userId) {
    return {
      hasAccess: true,
      role: "OWNER",
      isOwner: true,
      isEditor: true,
      isViewer: true,
      canEdit: true,
      canManage: true,
    };
  }

  // Check membership in plan_members
  const member = queryOne<{ role: string }>(
    "SELECT role FROM plan_members WHERE plan_id = ? AND user_id = ?",
    [planId, userId]
  );

  if (!member) {
    return {
      hasAccess: false,
      role: null,
      isOwner: false,
      isEditor: false,
      isViewer: false,
      canEdit: false,
      canManage: false,
    };
  }

  const role = member.role as PlanRole;
  const isOwner = role === "OWNER";
  const isEditor = role === "EDITOR" || isOwner;
  const isViewer = role === "VIEWER" || isEditor;

  return {
    hasAccess: true,
    role,
    isOwner,
    isEditor,
    isViewer,
    canEdit: isEditor,
    canManage: isOwner,
  };
}

export function logActivity(
  planId: string,
  actorId: string,
  action: string,
  details: string,
  entityType?: string,
  entityId?: string
) {
  try {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    execute(
      `INSERT INTO activities (id, plan_id, actor_id, action, details, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, planId, actorId, action, details, entityType || null, entityId || null, now]
    );
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
