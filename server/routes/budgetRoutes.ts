import { Router, Response } from "express";
import { queryOne, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router({ mergeParams: true });

// Add Budget Item
router.post("/:planId/budget-items", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.planId;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Owners and Editors can manage budget." });
    }

    const { name, estimated_amount, actual_amount, notes } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Budget item name is required." });
    }

    const itemId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO budget_items (id, plan_id, name, estimated_amount, actual_amount, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        planId,
        name.trim(),
        Number(estimated_amount) || 0,
        Number(actual_amount) || 0,
        notes ? notes.trim() : null,
        now,
        now,
      ]
    );

    await execute("UPDATE plans SET updated_at = ?, budget_enabled = 1 WHERE id = ?", [now, planId]);
    await logActivity(planId, userId, "created_budget_item", `added budget item "${name.trim()}"`, "budget", itemId);

    const item = await queryOne("SELECT * FROM budget_items WHERE id = ?", [itemId]);
    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Budget Item
router.put("/:planId/budget-items/:itemId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, itemId } = req.params;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const { name, estimated_amount, actual_amount, notes } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Budget item name cannot be empty." });
    }

    const existing = await queryOne("SELECT id, name FROM budget_items WHERE id = ? AND plan_id = ?", [
      itemId,
      planId,
    ]);

    if (!existing) {
      return res.status(404).json({ error: "Budget item not found." });
    }

    const now = new Date().toISOString();

    await execute(
      `UPDATE budget_items 
       SET name = ?, estimated_amount = ?, actual_amount = ?, notes = ?, updated_at = ?
       WHERE id = ? AND plan_id = ?`,
      [
        name.trim(),
        Number(estimated_amount) || 0,
        Number(actual_amount) || 0,
        notes ? notes.trim() : null,
        now,
        itemId,
        planId,
      ]
    );

    await execute("UPDATE plans SET updated_at = ? WHERE id = ?", [now, planId]);
    await logActivity(planId, userId, "updated_budget_item", `updated budget item "${name.trim()}"`, "budget", itemId);

    const updatedItem = await queryOne("SELECT * FROM budget_items WHERE id = ?", [itemId]);
    res.json({ item: updatedItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Budget Item
router.delete("/:planId/budget-items/:itemId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, itemId } = req.params;

    const access = await getPlanAccess(userId, planId);
    if (!access.canEdit) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const item = await queryOne<{ name: string }>(
      "SELECT name FROM budget_items WHERE id = ? AND plan_id = ?",
      [itemId, planId]
    );

    if (!item) {
      return res.status(404).json({ error: "Budget item not found." });
    }

    await execute("DELETE FROM budget_items WHERE id = ? AND plan_id = ?", [itemId, planId]);
    await logActivity(planId, userId, "deleted_budget_item", `removed budget item "${item.name}"`, "budget", itemId);

    res.json({ message: "Budget item deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
