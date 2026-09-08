import { Router, Response } from "express";
import { queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router({ mergeParams: true });

// 1. Create Task
router.post("/:planId/tasks", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can add tasks." });
    }

    const { title, description, status, priority, due_date, assignee_id, milestone_id } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const taskId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO tasks (id, plan_id, milestone_id, title, description, status, priority, due_date, assignee_id, created_by, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        taskId,
        planId,
        milestone_id || null,
        title.trim(),
        description ? description.trim() : null,
        status || "TODO",
        priority || "MEDIUM",
        due_date || null,
        assignee_id || null,
        userId,
        now,
        now,
      ]
    );

    // Update plan's updated_at
    await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);

    await logActivity(planId, userId, "created_task", `added task "${title.trim()}"`, "task", taskId);

    const task = await queryOne(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, m.title as milestone_title
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN milestones m ON t.milestone_id = m.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.status(201).json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update Task
router.put("/:planId/tasks/:taskId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, taskId } = req.params;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can modify tasks." });
    }

    const existing = await queryOne<{ id: string; title: string; status: string }>(
      "SELECT id, title, status FROM tasks WHERE id = ? AND plan_id = ?",
      [taskId, planId]
    );

    if (!existing) {
      return res.status(404).json({ error: "Task not found." });
    }

    const { title, description, status, priority, due_date, assignee_id, milestone_id } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Task title cannot be empty." });
    }

    const now = new Date().toISOString();

    await execute(
      `UPDATE tasks 
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assignee_id = ?, milestone_id = ?, updated_at = ?
       WHERE id = ? AND plan_id = ?`,
      [
        title.trim(),
        description ? description.trim() : null,
        status || "TODO",
        priority || "MEDIUM",
        due_date || null,
        assignee_id || null,
        milestone_id || null,
        now,
        taskId,
        planId,
      ]
    );

    await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);

    // Check if status changed
    if (existing.status !== status) {
      if (status === "COMPLETED") {
        await logActivity(planId, userId, "completed_task", `completed "${title.trim()}"`, "task", taskId);
      } else {
        await logActivity(planId, userId, "reopened_task", `reopened "${title.trim()}"`, "task", taskId);
      }
    } else {
      await logActivity(planId, userId, "updated_task", `updated task "${title.trim()}"`, "task", taskId);
    }

    const updatedTask = await queryOne(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, m.title as milestone_title
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN milestones m ON t.milestone_id = m.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.json({ task: updatedTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Quick Toggle Task Status
router.patch("/:planId/tasks/:taskId/toggle", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, taskId } = req.params;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const task = await queryOne<{ id: string; title: string; status: string }>(
      "SELECT id, title, status FROM tasks WHERE id = ? AND plan_id = ?",
      [taskId, planId]
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    const now = new Date().toISOString();

    await execute("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?", [nextStatus, now, taskId]);
    await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);

    if (nextStatus === "COMPLETED") {
      await logActivity(planId, userId, "completed_task", `completed "${task.title}"`, "task", taskId);
    } else {
      await logActivity(planId, userId, "reopened_task", `reopened "${task.title}"`, "task", taskId);
    }

    const updatedTask = await queryOne(
      `SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar, m.title as milestone_title
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN milestones m ON t.milestone_id = m.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.json({ task: updatedTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete Task
router.delete("/:planId/tasks/:taskId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, taskId } = req.params;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const task = await queryOne<{ title: string }>("SELECT title FROM tasks WHERE id = ? AND plan_id = ?", [
      taskId,
      planId,
    ]);

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    await execute("DELETE FROM tasks WHERE id = ? AND plan_id = ?", [taskId, planId]);
    await logActivity(planId, userId, "deleted_task", `deleted task "${task.title}"`, "task", taskId);

    res.json({ message: "Task deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
