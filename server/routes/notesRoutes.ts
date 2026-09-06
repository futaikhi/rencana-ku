import { Router, Response } from "express";
import { queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router({ mergeParams: true });

// Get Notes
router.get("/:planId/notes", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = getPlanAccess(userId, planId);
    if (!access.hasAccess) {
      return res.status(403).json({ error: "Access denied." });
    }

    const plan = queryOne<{ notes: string }>("SELECT notes FROM plans WHERE id = ?", [planId]);
    res.json({ notes: plan ? plan.notes || "" : "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Notes
router.put("/:planId/notes", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can edit notes." });
    }

    const { notes } = req.body;
    const now = new Date().toISOString();

    execute("UPDATE plans SET notes = ?, updated_at = ? WHERE id = ?", [notes || "", now, planId]);
    logActivity(planId, userId, "updated_notes", "updated plan notes & memos", "notes", planId);

    res.json({ notes: notes || "", updated_at: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
