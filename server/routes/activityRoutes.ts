import { Router, Response } from "express";
import { queryAll } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess } from "../authorization.js";

const router = Router();

// Get recent activity across all user plans (Dashboard Feed)
router.get("/feed", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const activities = await queryAll(
      `SELECT a.*, u.name as actor_name, u.avatar_url as actor_avatar,
              p.name as plan_name, p.icon as plan_icon, p.color as plan_color
       FROM activities a
       JOIN users u ON a.actor_id = u.id
       JOIN plans p ON a.plan_id = p.id
       LEFT JOIN plan_members pm ON p.id = pm.plan_id AND pm.user_id = ?
       WHERE p.owner_id = ? OR pm.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT 25`,
      [userId, userId, userId]
    );

    res.json({ activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get activity for specific plan
router.get("/plans/:planId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = await getPlanAccess(userId, planId);
    if (!access.hasAccess) {
      return res.status(403).json({ error: "Access denied." });
    }

    const activities = await queryAll(
      `SELECT a.*, u.name as actor_name, u.avatar_url as actor_avatar
       FROM activities a
       JOIN users u ON a.actor_id = u.id
       WHERE a.plan_id = ?
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [planId]
    );

    res.json({ activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
