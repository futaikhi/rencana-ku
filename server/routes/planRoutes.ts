import { Router, Response } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router();

// Helper to compute plan stats
async function enrichPlanWithProgress(plan: any, userId: string) {
  const planId = plan.id;
  const tasks = await queryAll<{ id: string; status: string }>(
    "SELECT id, status FROM tasks WHERE plan_id = ?",
    [planId]
  );
  const milestones = await queryAll<{ id: string; status: string }>(
    "SELECT id, status FROM milestones WHERE plan_id = ?",
    [planId]
  );
  const budgetItems = await queryAll<{ estimated_amount: number; actual_amount: number }>(
    "SELECT estimated_amount, actual_amount FROM budget_items WHERE plan_id = ?",
    [planId]
  );
  const members = await queryAll<{ id: string; user_id: string; role: string; name: string; avatar_url: string; is_demo?: number }>(
    `SELECT pm.id, pm.user_id, pm.role, u.name, u.avatar_url, u.is_demo 
     FROM plan_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.plan_id = ?
     ORDER BY pm.role ASC, u.name ASC`,
    [planId]
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length;

  const totalEstimated = budgetItems.reduce((sum, b) => sum + (b.estimated_amount || 0), 0);
  const totalActual = budgetItems.reduce((sum, b) => sum + (b.actual_amount || 0), 0);

  // Overall progress percentage (weighted by tasks & milestones if exist)
  let progress = 0;
  if (totalTasks > 0 && totalMilestones > 0) {
    const taskRatio = completedTasks / totalTasks;
    const milestoneRatio = completedMilestones / totalMilestones;
    progress = Math.round((taskRatio * 0.6 + milestoneRatio * 0.4) * 100);
  } else if (totalTasks > 0) {
    progress = Math.round((completedTasks / totalTasks) * 100);
  } else if (totalMilestones > 0) {
    progress = Math.round((completedMilestones / totalMilestones) * 100);
  }

  const access = await getPlanAccess(userId, planId);

  return {
    ...plan,
    budget_enabled: Boolean(plan.budget_enabled),
    role: access.role,
    isOwner: access.isOwner,
    isEditor: access.isEditor,
    isViewer: access.isViewer,
    stats: {
      totalTasks,
      completedTasks,
      totalMilestones,
      completedMilestones,
      progress,
      totalEstimated,
      totalActual,
      remainingBudget: (plan.budget_target || totalEstimated) - totalActual,
      memberCount: members.length,
    },
    members,
  };
}

// 1. GET /api/plans - List My Plans & Shared Plans
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Plans owned by current user
    const rawMyPlans = await queryAll(
      `SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar
       FROM plans p
       JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = ?
       ORDER BY p.updated_at DESC`,
      [userId]
    );

    // Plans where user is a member (but not owner)
    const rawSharedPlans = await queryAll(
      `SELECT p.*, u.name as owner_name, u.avatar_url as owner_avatar, pm.role as user_role
       FROM plans p
       JOIN users u ON p.owner_id = u.id
       JOIN plan_members pm ON p.id = pm.plan_id
       WHERE pm.user_id = ? AND p.owner_id != ?
       ORDER BY p.updated_at DESC`,
      [userId, userId]
    );

    const myPlans = await Promise.all(rawMyPlans.map((p) => enrichPlanWithProgress(p, userId)));
    const sharedPlans = await Promise.all(rawSharedPlans.map((p) => enrichPlanWithProgress(p, userId)));

    // Also get pending invitations for the user
    const pendingInvitations = await queryAll(
      `SELECT pi.id, pi.plan_id, pi.role, pi.status, pi.created_at,
              p.name as plan_name, p.icon as plan_icon, p.color as plan_color, p.category as plan_category,
              u.name as inviter_name, u.avatar_url as inviter_avatar
       FROM plan_invitations pi
       JOIN plans p ON pi.plan_id = p.id
       JOIN users u ON pi.inviter_id = u.id
       WHERE pi.invitee_id = ? AND pi.status = 'PENDING'
       ORDER BY pi.created_at DESC`,
      [userId]
    );

    // Upcoming urgent items across all user plans
    const upcomingTasks = await queryAll(
      `SELECT t.*, p.name as plan_name, p.color as plan_color, p.icon as plan_icon
       FROM tasks t
       JOIN plans p ON t.plan_id = p.id
       LEFT JOIN plan_members pm ON p.id = pm.plan_id AND pm.user_id = ?
       WHERE (p.owner_id = ? OR pm.user_id = ?)
         AND t.status != 'COMPLETED'
         AND t.due_date IS NOT NULL
       ORDER BY t.due_date ASC
       LIMIT 5`,
      [userId, userId, userId]
    );

    const upcomingMilestones = await queryAll(
      `SELECT m.*, p.name as plan_name, p.color as plan_color, p.icon as plan_icon
       FROM milestones m
       JOIN plans p ON m.plan_id = p.id
       LEFT JOIN plan_members pm ON p.id = pm.plan_id AND pm.user_id = ?
       WHERE (p.owner_id = ? OR pm.user_id = ?)
         AND m.status != 'COMPLETED'
         AND m.target_date IS NOT NULL
       ORDER BY m.target_date ASC
       LIMIT 5`,
      [userId, userId, userId]
    );

    res.json({
      myPlans,
      sharedPlans,
      pendingInvitations,
      upcomingTasks,
      upcomingMilestones,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/plans - Create Plan
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      description,
      category,
      icon,
      color,
      target_date,
      budget_enabled,
      budget_target,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Plan name is required." });
    }

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const planCategory = category || "Custom";
    const planIcon = icon || "Target";
    const planColor = color || "#C45A38";
    const hasBudget = budget_enabled ? 1 : 0;
    const targetBudget = Number(budget_target) || 0;

    await execute(
      `INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
      [
        planId,
        userId,
        name.trim(),
        description ? description.trim() : null,
        planCategory,
        planIcon,
        planColor,
        target_date || null,
        hasBudget,
        targetBudget,
        now,
        now,
      ]
    );

    // Automatically add owner to plan_members
    const memberId = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await execute(
      `INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'OWNER', ?)`,
      [memberId, planId, userId, now]
    );

    // Log activity
    await logActivity(planId, userId, "created_plan", `created the plan "${name.trim()}"`, "plan", planId);

    const createdPlan = await queryOne("SELECT * FROM plans WHERE id = ?", [planId]);
    const enriched = await enrichPlanWithProgress(createdPlan, userId);

    res.status(201).json({ plan: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/plans/:id - Get Full Plan Details
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.id;

    const access = await getPlanAccess(userId, planId);
    if (!access.hasAccess) {
      return res.status(403).json({ error: "Access denied. You are not a member of this Plan." });
    }

    const plan = await queryOne(
      `SELECT p.*, u.name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar
       FROM plans p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [planId]
    );

    if (!plan) {
      return res.status(404).json({ error: "Plan not found." });
    }

    // Fetch Milestones
    const milestones = await queryAll(
      `SELECT * FROM milestones WHERE plan_id = ? ORDER BY sort_order ASC, created_at ASC`,
      [planId]
    );

    // Fetch Tasks with Assignee details and Milestone Title
    const tasks = await queryAll(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, m.title as milestone_title
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN milestones m ON t.milestone_id = m.id
       WHERE t.plan_id = ?
       ORDER BY t.sort_order ASC, t.created_at ASC`,
      [planId]
    );

    // Calculate progress for each milestone based on its attached tasks
    const milestonesWithTaskProgress = milestones.map((m) => {
      const relatedTasks = tasks.filter((t) => t.milestone_id === m.id);
      const totalRelated = relatedTasks.length;
      const completedRelated = relatedTasks.filter((t) => t.status === "COMPLETED").length;
      return {
        ...m,
        totalTasks: totalRelated,
        completedTasks: completedRelated,
        taskProgress: totalRelated > 0 ? Math.round((completedRelated / totalRelated) * 100) : m.status === "COMPLETED" ? 100 : 0,
      };
    });

    // Fetch Budget Items
    const budgetItems = await queryAll(
      `SELECT * FROM budget_items WHERE plan_id = ? ORDER BY created_at ASC`,
      [planId]
    );

    // Fetch Members
    const rawMembers = await queryAll<{
      id: string;
      user_id: string;
      role: string;
      joined_at: string;
      name: string;
      email: string;
      avatar_url: string;
      bio: string;
      is_demo?: number;
    }>(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.name, u.email, u.avatar_url, u.bio, u.is_demo
       FROM plan_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.plan_id = ?
       ORDER BY CASE pm.role WHEN 'OWNER' THEN 1 WHEN 'EDITOR' THEN 2 ELSE 3 END, u.name ASC`,
      [planId]
    );
    const members = rawMembers.map(m => ({ ...m, is_demo: Boolean(m.is_demo) }));

    // Fetch Pending Invitations for this Plan (for owners/editors)
    const invitations = access.canEdit
      ? await queryAll(
          `SELECT pi.*, u.name as invitee_name, u.email as invitee_email, u.avatar_url as invitee_avatar
           FROM plan_invitations pi
           JOIN users u ON pi.invitee_id = u.id
           WHERE pi.plan_id = ? AND pi.status = 'PENDING'
           ORDER BY pi.created_at DESC`,
          [planId]
        )
      : [];

    // Fetch Recent Activities
    const activities = await queryAll(
      `SELECT a.*, u.name as actor_name, u.avatar_url as actor_avatar
       FROM activities a
       JOIN users u ON a.actor_id = u.id
       WHERE a.plan_id = ?
       ORDER BY a.created_at DESC
       LIMIT 30`,
      [planId]
    );

    const enriched = await enrichPlanWithProgress(plan, userId);

    res.json({
      plan: enriched,
      access,
      milestones: milestonesWithTaskProgress,
      tasks,
      budgetItems,
      members,
      invitations,
      activities,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/plans/:id - Update Plan
router.put("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.id;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can update this Plan." });
    }

    const {
      name,
      description,
      category,
      icon,
      color,
      target_date,
      budget_enabled,
      budget_target,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Plan name cannot be empty." });
    }

    const now = new Date().toISOString();
    const hasBudget = budget_enabled ? 1 : 0;
    const targetBudget = Number(budget_target) || 0;

    await execute(
      `UPDATE plans 
       SET name = ?, description = ?, category = ?, icon = ?, color = ?, target_date = ?, 
           budget_enabled = ?, budget_target = ?, updated_at = ?
       WHERE id = ?`,
      [
        name.trim(),
        description ? description.trim() : null,
        category || "Custom",
        icon || "Target",
        color || "#C45A38",
        target_date || null,
        hasBudget,
        targetBudget,
        now,
        planId,
      ]
    );

    await logActivity(planId, userId, "updated_plan", `updated the plan details`, "plan", planId);

    const updatedPlan = await queryOne("SELECT * FROM plans WHERE id = ?", [planId]);
    const enriched = await enrichPlanWithProgress(updatedPlan, userId);

    res.json({ plan: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/plans/:id - Delete Plan (Owner Only)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.id;

    const access = await getPlanAccess(userId, planId);
    if (!access.isOwner) {
      return res.status(403).json({ error: "Forbidden. Only the Plan Owner can delete this Plan." });
    }

    await execute("DELETE FROM plans WHERE id = ?", [planId]);

    res.json({ message: "Plan deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/plans/:id/leave - Leave Plan (Non-Owners only)
router.post("/:id/leave", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.id;

    const access = await getPlanAccess(userId, planId);
    if (!access.hasAccess) {
      return res.status(400).json({ error: "You are not a member of this Plan." });
    }

    if (access.isOwner) {
      return res.status(400).json({ error: "The Owner cannot leave the Plan. Transfer ownership or delete the Plan instead." });
    }

    await execute("DELETE FROM plan_members WHERE plan_id = ? AND user_id = ?", [planId, userId]);
    await logActivity(planId, userId, "left_plan", `${req.user!.name} left the Plan`, "member", userId);

    res.json({ message: "You have left the Plan." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
