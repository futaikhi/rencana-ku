import { Router, Response } from "express";
import { queryAll, queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router();

export interface SyncMutation {
  id: string;
  type: string;
  entityId: string;
  planId?: string;
  payload: any;
  createdAt: string;
}

// POST /api/sync
// Reconciles and executes batch offline mutations on user's authorized plans
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mutations } = req.body as { mutations?: SyncMutation[] };

    const results: { id: string; status: "applied" | "skipped" | "error"; error?: string }[] = [];

    if (Array.isArray(mutations) && mutations.length > 0) {
      for (const m of mutations) {
        try {
          const now = new Date().toISOString();

          switch (m.type) {
            case "CREATE_PLAN": {
              const { id, name, description, category, icon, color, target_date, budget_enabled, budget_target } = m.payload;
              if (!id || !name) {
                results.push({ id: m.id, status: "skipped", error: "Missing plan id or name" });
                break;
              }
              const existing = await queryOne("SELECT id FROM plans WHERE id = ?", [id]);
              if (existing) {
                // Update if already exists
                await execute(
                  `UPDATE plans SET name = ?, description = ?, category = ?, icon = ?, color = ?, target_date = ?, budget_enabled = ?, budget_target = ?, updated_at = ? WHERE id = ?`,
                  [
                    name,
                    description || null,
                    category || "Personal",
                    icon || "Compass",
                    color || "#C45A38",
                    target_date || null,
                    budget_enabled ? 1 : 0,
                    Number(budget_target) || 0,
                    now,
                    id,
                  ]
                );
              } else {
                await execute(
                  `INSERT INTO plans (id, owner_id, name, description, category, icon, color, target_date, budget_enabled, budget_target, notes, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    id,
                    userId,
                    name,
                    description || null,
                    category || "Personal",
                    icon || "Compass",
                    color || "#C45A38",
                    target_date || null,
                    budget_enabled ? 1 : 0,
                    Number(budget_target) || 0,
                    "",
                    m.createdAt || now,
                    now,
                  ]
                );
                // Add creator as OWNER in plan_members
                await execute(
                  `INSERT OR IGNORE INTO plan_members (id, plan_id, user_id, role, joined_at) VALUES (?, ?, ?, 'OWNER', ?)`,
                  [`pm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, id, userId, now]
                );
                await logActivity(id, userId, "created_plan", `created plan "${name}"`, "plan", id);
              }
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "UPDATE_PLAN": {
              const planId = m.entityId || m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const { name, description, category, icon, color, target_date, budget_enabled, budget_target } = m.payload;
              await execute(
                `UPDATE plans SET
                  name = COALESCE(?, name),
                  description = COALESCE(?, description),
                  category = COALESCE(?, category),
                  icon = COALESCE(?, icon),
                  color = COALESCE(?, color),
                  target_date = COALESCE(?, target_date),
                  budget_enabled = COALESCE(?, budget_enabled),
                  budget_target = COALESCE(?, budget_target),
                  updated_at = ?
                 WHERE id = ?`,
                [
                  name ?? null,
                  description ?? null,
                  category ?? null,
                  icon ?? null,
                  color ?? null,
                  target_date ?? null,
                  budget_enabled !== undefined ? (budget_enabled ? 1 : 0) : null,
                  budget_target !== undefined ? Number(budget_target) : null,
                  now,
                  planId,
                ]
              );
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "DELETE_PLAN": {
              const planId = m.entityId || m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.isOwner) {
                results.push({ id: m.id, status: "skipped", error: "Only owner can delete plan" });
                break;
              }
              await execute("DELETE FROM tasks WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM milestones WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM budget_items WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM plan_members WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM plan_invitations WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM activities WHERE plan_id = ?", [planId]);
              await execute("DELETE FROM plans WHERE id = ?", [planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "CREATE_TASK": {
              const planId = m.planId || m.payload.plan_id;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const { id, title, description, status, priority, due_date, assignee_id, milestone_id } = m.payload;
              const taskId = id || m.entityId;
              const existing = await queryOne("SELECT id FROM tasks WHERE id = ?", [taskId]);
              if (existing) {
                await execute(
                  `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assignee_id = ?, milestone_id = ?, updated_at = ? WHERE id = ?`,
                  [title, description || null, status || "TODO", priority || "MEDIUM", due_date || null, assignee_id || null, milestone_id || null, now, taskId]
                );
              } else {
                await execute(
                  `INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                  [taskId, planId, milestone_id || null, title, description || null, status || "TODO", priority || "MEDIUM", due_date || null, assignee_id || null, userId, m.createdAt || now, now]
                );
                await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              }
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "UPDATE_TASK":
            case "TOGGLE_TASK": {
              const planId = m.planId || m.payload.plan_id;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const taskId = m.entityId;
              const { title, description, status, priority, due_date, assignee_id, milestone_id } = m.payload;
              await execute(
                `UPDATE tasks SET
                  title = COALESCE(?, title),
                  description = COALESCE(?, description),
                  status = COALESCE(?, status),
                  priority = COALESCE(?, priority),
                  due_date = COALESCE(?, due_date),
                  assignee_id = COALESCE(?, assignee_id),
                  milestone_id = COALESCE(?, milestone_id),
                  updated_at = ?
                 WHERE id = ?`,
                [
                  title ?? null,
                  description ?? null,
                  status ?? null,
                  priority ?? null,
                  due_date ?? null,
                  assignee_id ?? null,
                  milestone_id ?? null,
                  now,
                  taskId,
                ]
              );
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "DELETE_TASK": {
              const planId = m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              await execute("DELETE FROM tasks WHERE id = ?", [m.entityId]);
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "CREATE_MILESTONE": {
              const planId = m.planId || m.payload.plan_id;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const { id, title, description, target_date, status, sort_order } = m.payload;
              const msId = id || m.entityId;
              const existing = await queryOne("SELECT id FROM milestones WHERE id = ?", [msId]);
              if (existing) {
                await execute(
                  `UPDATE milestones SET title = ?, description = ?, target_date = ?, status = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
                  [title, description || null, target_date || null, status || "PENDING", Number(sort_order) || 0, now, msId]
                );
              } else {
                await execute(
                  `INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [msId, planId, title, description || null, target_date || null, status || "PENDING", Number(sort_order) || 0, m.createdAt || now, now]
                );
                await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              }
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "UPDATE_MILESTONE":
            case "TOGGLE_MILESTONE": {
              const planId = m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const msId = m.entityId;
              const { title, description, target_date, status, sort_order } = m.payload;
              await execute(
                `UPDATE milestones SET
                  title = COALESCE(?, title),
                  description = COALESCE(?, description),
                  target_date = COALESCE(?, target_date),
                  status = COALESCE(?, status),
                  sort_order = COALESCE(?, sort_order),
                  updated_at = ?
                 WHERE id = ?`,
                [
                  title ?? null,
                  description ?? null,
                  target_date ?? null,
                  status ?? null,
                  sort_order !== undefined ? Number(sort_order) : null,
                  now,
                  msId,
                ]
              );
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "DELETE_MILESTONE": {
              const planId = m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              await execute("DELETE FROM milestones WHERE id = ?", [m.entityId]);
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "CREATE_BUDGET_ITEM": {
              const planId = m.planId || m.payload.plan_id;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const { id, category, item_name, estimated_amount, actual_amount, notes } = m.payload;
              const itemId = id || m.entityId;
              const existing = await queryOne("SELECT id FROM budget_items WHERE id = ?", [itemId]);
              if (existing) {
                await execute(
                  `UPDATE budget_items SET category = ?, item_name = ?, estimated_amount = ?, actual_amount = ?, notes = ?, updated_at = ? WHERE id = ?`,
                  [category || "General", item_name, Number(estimated_amount) || 0, Number(actual_amount) || 0, notes || null, now, itemId]
                );
              } else {
                await execute(
                  `INSERT INTO budget_items (id, plan_id, category, item_name, estimated_amount, actual_amount, notes, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [itemId, planId, category || "General", item_name, Number(estimated_amount) || 0, Number(actual_amount) || 0, notes || null, m.createdAt || now, now]
                );
                await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              }
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "UPDATE_BUDGET_ITEM": {
              const planId = m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const itemId = m.entityId;
              const { category, item_name, estimated_amount, actual_amount, notes } = m.payload;
              await execute(
                `UPDATE budget_items SET
                  category = COALESCE(?, category),
                  item_name = COALESCE(?, item_name),
                  estimated_amount = COALESCE(?, estimated_amount),
                  actual_amount = COALESCE(?, actual_amount),
                  notes = COALESCE(?, notes),
                  updated_at = ?
                 WHERE id = ?`,
                [
                  category ?? null,
                  item_name ?? null,
                  estimated_amount !== undefined ? Number(estimated_amount) : null,
                  actual_amount !== undefined ? Number(actual_amount) : null,
                  notes ?? null,
                  now,
                  itemId,
                ]
              );
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "DELETE_BUDGET_ITEM": {
              const planId = m.planId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              await execute("DELETE FROM budget_items WHERE id = ?", [m.entityId]);
              await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            case "UPDATE_NOTES": {
              const planId = m.planId || m.entityId;
              const access = await getPlanAccess(userId, planId);
              if (!access.canEdit) {
                results.push({ id: m.id, status: "skipped", error: "Unauthorized" });
                break;
              }
              const { notes } = m.payload;
              await execute("UPDATE plans SET notes = ?, updated_at = ? WHERE id = ?", [notes ?? "", now, planId]);
              results.push({ id: m.id, status: "applied" });
              break;
            }

            default:
              results.push({ id: m.id, status: "skipped", error: `Unknown mutation type ${m.type}` });
          }
        } catch (err: any) {
          console.error(`Sync error on mutation ${m.id}:`, err);
          results.push({ id: m.id, status: "error", error: err.message });
        }
      }
    }

    const appliedCount = results.filter((r) => r.status === "applied").length;

    res.json({
      success: true,
      appliedCount,
      totalReceived: mutations ? mutations.length : 0,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    console.error("Sync endpoint failure:", err);
    res.status(500).json({ error: err.message || "Failed to process synchronization" });
  }
});

export default router;
