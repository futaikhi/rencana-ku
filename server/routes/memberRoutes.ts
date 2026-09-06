import { Router, Response } from "express";
import { queryOne, queryAll, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router({ mergeParams: true });

// Get Members
router.get("/:planId/members", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = getPlanAccess(userId, planId);
    if (!access.hasAccess) {
      return res.status(403).json({ error: "Access denied." });
    }

    const members = queryAll(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.name, u.email, u.avatar_url, u.bio
       FROM plan_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.plan_id = ?
       ORDER BY CASE pm.role WHEN 'OWNER' THEN 1 WHEN 'EDITOR' THEN 2 ELSE 3 END, u.name ASC`,
      [planId]
    );

    res.json({ members, access });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Member Role (Owner only)
router.put("/:planId/members/:memberId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, memberId } = req.params;
    const { role } = req.body;

    const access = getPlanAccess(userId, planId);
    if (!access.isOwner) {
      return res.status(403).json({ error: "Only the Plan Owner can modify member roles." });
    }

    if (!["EDITOR", "VIEWER"].includes(role)) {
      return res.status(400).json({ error: "Role must be EDITOR or VIEWER." });
    }

    const member = queryOne<{ id: string; user_id: string; role: string; name: string }>(
      `SELECT pm.id, pm.user_id, pm.role, u.name 
       FROM plan_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = ? AND pm.plan_id = ?`,
      [memberId, planId]
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    if (member.role === "OWNER" || member.user_id === userId) {
      return res.status(400).json({ error: "Cannot change the Owner's role." });
    }

    execute("UPDATE plan_members SET role = ? WHERE id = ?", [role, memberId]);
    logActivity(planId, userId, "updated_member_role", `changed ${member.name}'s role to ${role}`, "member", member.user_id);

    const updated = queryOne(
      `SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.name, u.email, u.avatar_url, u.bio
       FROM plan_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = ?`,
      [memberId]
    );

    res.json({ member: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove Member (Owner only)
router.delete("/:planId/members/:memberId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, memberId } = req.params;

    const access = getPlanAccess(userId, planId);
    if (!access.isOwner) {
      return res.status(403).json({ error: "Only the Plan Owner can remove members." });
    }

    const member = queryOne<{ id: string; user_id: string; role: string; name: string }>(
      `SELECT pm.id, pm.user_id, pm.role, u.name 
       FROM plan_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = ? AND pm.plan_id = ?`,
      [memberId, planId]
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    if (member.user_id === userId || member.role === "OWNER") {
      return res.status(400).json({ error: "Cannot remove the Plan Owner." });
    }

    // Unassign tasks assigned to this user in this plan
    execute("UPDATE tasks SET assignee_id = NULL WHERE plan_id = ? AND assignee_id = ?", [
      planId,
      member.user_id,
    ]);

    execute("DELETE FROM plan_members WHERE id = ?", [memberId]);
    logActivity(planId, userId, "removed_member", `removed ${member.name} from the Plan`, "member", member.user_id);

    res.json({ message: `${member.name} has been removed from the Plan.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
