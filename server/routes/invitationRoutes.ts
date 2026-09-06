import { Router, Response } from "express";
import { queryOne, queryAll, execute } from "../db.js";
import { authenticateToken, AuthRequest } from "../auth.js";
import { getPlanAccess, logActivity } from "../authorization.js";

const router = Router();

// 1. Get current user's pending invitations
router.get("/", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const invitations = queryAll(
      `SELECT pi.id, pi.plan_id, pi.role, pi.status, pi.created_at,
              p.name as plan_name, p.description as plan_description, p.icon as plan_icon, 
              p.color as plan_color, p.category as plan_category,
              u.name as inviter_name, u.email as inviter_email, u.avatar_url as inviter_avatar
       FROM plan_invitations pi
       JOIN plans p ON pi.plan_id = p.id
       JOIN users u ON pi.inviter_id = u.id
       WHERE pi.invitee_id = ? AND pi.status = 'PENDING'
       ORDER BY pi.created_at DESC`,
      [userId]
    );

    res.json({ invitations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Send Invitation to a Plan (Owner or Editor with permission)
router.post("/plans/:planId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const inviterId = req.user!.id;
    const planId = req.params.planId;
    const { email, userId: targetUserId, role = "EDITOR" } = req.body;

    const access = getPlanAccess(inviterId, planId);
    if (!access.canManage && !access.canEdit) {
      return res.status(403).json({ error: "Permission denied. Only Plan Owners and Editors can invite members." });
    }

    if (!["EDITOR", "VIEWER"].includes(role)) {
      return res.status(400).json({ error: "Invited role must be EDITOR or VIEWER." });
    }

    // Find the target user by ID or email
    let invitee: { id: string; name: string; email: string; avatar_url: string } | null = null;
    if (targetUserId) {
      invitee = queryOne("SELECT id, name, email, avatar_url FROM users WHERE id = ?", [targetUserId]);
    } else if (email) {
      invitee = queryOne("SELECT id, name, email, avatar_url FROM users WHERE LOWER(email) = LOWER(?)", [
        email.trim(),
      ]);
    }

    if (!invitee) {
      return res.status(404).json({ error: "User not found. Ensure the user has registered on PlanCraft first." });
    }

    if (invitee.id === inviterId) {
      return res.status(400).json({ error: "You cannot invite yourself." });
    }

    // Check if already a member
    const existingMember = queryOne(
      "SELECT id, role FROM plan_members WHERE plan_id = ? AND user_id = ?",
      [planId, invitee.id]
    );
    if (existingMember) {
      return res.status(409).json({ error: `${invitee.name} is already a member of this Plan.` });
    }

    // Check if there is already a pending invitation
    const existingInvite = queryOne(
      "SELECT id FROM plan_invitations WHERE plan_id = ? AND invitee_id = ? AND status = 'PENDING'",
      [planId, invitee.id]
    );
    if (existingInvite) {
      return res.status(409).json({ error: `An active invitation has already been sent to ${invitee.name}.` });
    }

    const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    execute(
      `INSERT INTO plan_invitations (id, plan_id, inviter_id, invitee_id, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [inviteId, planId, inviterId, invitee.id, role, now]
    );

    logActivity(
      planId,
      inviterId,
      "sent_invitation",
      `invited ${invitee.name} to join as ${role}`,
      "member",
      invitee.id
    );

    const createdInvite = queryOne(
      `SELECT pi.*, u.name as invitee_name, u.email as invitee_email, u.avatar_url as invitee_avatar
       FROM plan_invitations pi
       JOIN users u ON pi.invitee_id = u.id
       WHERE pi.id = ?`,
      [inviteId]
    );

    res.status(201).json({ invitation: createdInvite, message: `Invitation sent to ${invitee.name}!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Respond to Invitation (Accept or Decline)
router.post("/:inviteId/respond", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const inviteId = req.params.inviteId;
    const { action } = req.body; // 'ACCEPT' or 'DECLINE'

    if (!["ACCEPT", "DECLINE"].includes(action)) {
      return res.status(400).json({ error: "Action must be ACCEPT or DECLINE." });
    }

    const invitation = queryOne<{
      id: string;
      plan_id: string;
      inviter_id: string;
      invitee_id: string;
      role: string;
      status: string;
    }>("SELECT * FROM plan_invitations WHERE id = ?", [inviteId]);

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found." });
    }

    if (invitation.invitee_id !== userId) {
      return res.status(403).json({ error: "This invitation is not addressed to you." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ error: `This invitation has already been ${invitation.status.toLowerCase()}.` });
    }

    const now = new Date().toISOString();

    if (action === "ACCEPT") {
      // Check if already in plan_members
      const existingMember = queryOne(
        "SELECT id FROM plan_members WHERE plan_id = ? AND user_id = ?",
        [invitation.plan_id, userId]
      );

      if (!existingMember) {
        const memberId = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        execute(
          `INSERT INTO plan_members (id, plan_id, user_id, role, joined_at)
           VALUES (?, ?, ?, ?, ?)`,
          [memberId, invitation.plan_id, userId, invitation.role, now]
        );
      }

      execute("UPDATE plan_invitations SET status = 'ACCEPTED' WHERE id = ?", [inviteId]);
      logActivity(invitation.plan_id, userId, "joined_plan", `${req.user!.name} accepted the invitation and joined the Plan as ${invitation.role}`, "member", userId);

      res.json({ message: "Invitation accepted! You are now a member of this Plan.", planId: invitation.plan_id });
    } else {
      execute("UPDATE plan_invitations SET status = 'DECLINED' WHERE id = ?", [inviteId]);
      logActivity(invitation.plan_id, userId, "declined_invitation", `${req.user!.name} declined the invitation`, "member", userId);

      res.json({ message: "Invitation declined." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Cancel Pending Invitation (Owner/Inviter)
router.delete("/:inviteId", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const inviteId = req.params.inviteId;

    const invitation = queryOne<{
      id: string;
      plan_id: string;
      inviter_id: string;
      status: string;
    }>("SELECT * FROM plan_invitations WHERE id = ?", [inviteId]);

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found." });
    }

    const access = getPlanAccess(userId, invitation.plan_id);
    if (!access.canManage && invitation.inviter_id !== userId) {
      return res.status(403).json({ error: "Permission denied to cancel this invitation." });
    }

    execute("DELETE FROM plan_invitations WHERE id = ?", [inviteId]);

    res.json({ message: "Invitation cancelled." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
