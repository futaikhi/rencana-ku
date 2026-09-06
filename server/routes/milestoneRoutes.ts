import { Router, Response } from "express";
import { queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router({ mergeParams: true });

// Create Milestone
router.post("/:planId/milestones", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can add milestones." });
    }

    const { title, description, target_date, status, sort_order } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Milestone title is required." });
    }

    const milestoneId = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    execute(
      `INSERT INTO milestones (id, plan_id, title, description, target_date, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        milestoneId,
        planId,
        title.trim(),
        description ? description.trim() : null,
        target_date || null,
        status || "PENDING",
        Number(sort_order) || 0,
        now,
        now,
      ]
    );

    execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
    logActivity(planId, userId, "created_milestone", `added milestone "${title.trim()}"`, "milestone", milestoneId);

    const milestone = queryOne("SELECT * FROM milestones WHERE id = ?", [milestoneId]);
    res.status(201).json({ milestone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Milestone
router.put("/:planId/milestones/:milestoneId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, milestoneId } = req.params;

    const access = getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const { title, description, target_date, status, sort_order } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Milestone title cannot be empty." });
    }

    const existing = queryOne<{ id: string; status: string; title: string }>(
      "SELECT id, status, title FROM milestones WHERE id = ? AND plan_id = ?",
      [milestoneId, planId]
    );

    if (!existing) {
      return res.status(404).json({ error: "Milestone not found." });
    }

    const now = new Date().toISOString();

    execute(
      `UPDATE milestones 
       SET title = ?, description = ?, target_date = ?, status = ?, sort_order = ?, updated_at = ?
       WHERE id = ? AND plan_id = ?`,
      [
        title.trim(),
        description ? description.trim() : null,
        target_date || null,
        status || "PENDING",
        Number(sort_order) || 0,
        now,
        milestoneId,
        planId,
      ]
    );

    execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);

    if (existing.status !== status) {
      if (status === "COMPLETED") {
        logActivity(planId, userId, "completed_milestone", `achieved milestone "${title.trim()}"`, "milestone", milestoneId);
      } else {
        logActivity(planId, userId, "reopened_milestone", `reopened milestone "${title.trim()}"`, "milestone", milestoneId);
      }
    } else {
      logActivity(planId, userId, "updated_milestone", `updated milestone "${title.trim()}"`, "milestone", milestoneId);
    }

    const updatedMilestone = queryOne("SELECT * FROM milestones WHERE id = ?", [milestoneId]);
    res.json({ milestone: updatedMilestone });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Milestone
router.patch("/:planId/milestones/:milestoneId/toggle", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, milestoneId } = req.params;

    const access = getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const milestone = queryOne<{ id: string; status: string; title: string }>(
      "SELECT id, status, title FROM milestones WHERE id = ? AND plan_id = ?",
      [milestoneId, planId]
    );

    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found." });
    }

    const nextStatus = milestone.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const now = new Date().toISOString();

    execute("UPDATE milestones SET status = ?, updated_at = ? WHERE id = ?", [nextStatus, now, milestoneId]);
    execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);

    if (nextStatus === "COMPLETED") {
      logActivity(planId, userId, "completed_milestone", `achieved milestone "${milestone.title}"`, "milestone", milestoneId);
    } else {
      logActivity(planId, userId, "reopened_milestone", `reopened milestone "${milestone.title}"`, "milestone", milestoneId);
    }

    const updated = queryOne("SELECT * FROM milestones WHERE id = ?", [milestoneId]);
    res.json({ milestone: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Milestone
router.delete("/:planId/milestones/:milestoneId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, milestoneId } = req.params;

    const access = getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const milestone = queryOne<{ title: string }>(
      "SELECT title FROM milestones WHERE id = ? AND plan_id = ?",
      [milestoneId, planId]
    );

    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found." });
    }

    // Detach any tasks referencing this milestone
    execute("UPDATE tasks SET milestone_id = NULL WHERE milestone_id = ?", [milestoneId]);
    execute("DELETE FROM milestones WHERE id = ? AND plan_id = ?", [milestoneId, planId]);

    logActivity(planId, userId, "deleted_milestone", `deleted milestone "${milestone.title}"`, "milestone", milestoneId);

    res.json({ message: "Milestone deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
