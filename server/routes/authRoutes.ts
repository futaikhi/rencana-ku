import { Router, Response } from "express";
import { queryOne, queryAll, execute } from "../db.js";
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthRequest } from "../auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, bio, avatar_url } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await queryOne("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email.trim()]);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const password_hash = hashPassword(password);
    const now = new Date().toISOString();
    const avatar = avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    await execute(
      `INSERT INTO users (id, name, email, password_hash, avatar_url, bio, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), email.trim().toLowerCase(), password_hash, avatar, bio || "", now]
    );

    const newUser = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar_url: avatar,
      bio: bio || "",
    };
    const token = generateToken(newUser);

    res.status(201).json({ user: newUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      avatar_url: string;
      bio: string;
    }>("SELECT id, name, email, password_hash, avatar_url, bio FROM users WHERE LOWER(email) = LOWER(?)", [
      email.trim(),
    ]);

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
    };

    const token = generateToken(safeUser);

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current User Profile
router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Update Profile
router.put("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, avatar_url, bio } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    await execute(
      "UPDATE users SET name = ?, avatar_url = ?, bio = ? WHERE id = ?",
      [name.trim(), avatar_url || null, bio || "", userId]
    );

    const updatedUser = await queryOne<{ id: string; name: string; email: string; avatar_url: string; bio: string }>(
      "SELECT id, name, email, avatar_url, bio FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      user: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put("/password", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const user = await queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (!user || !comparePassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const newHash = hashPassword(newPassword);
    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);

    res.json({ message: "Password updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search users to invite to a plan
router.get("/search", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string || "").trim().toLowerCase();
    const currentUserId = req.user!.id;

    if (!query) {
      const recentUsers = await queryAll<{ id: string; name: string; email: string; avatar_url: string }>(
        "SELECT id, name, email, avatar_url FROM users WHERE id != ? LIMIT 8",
        [currentUserId]
      );
      return res.json({
        users: recentUsers
      });
    }

    const users = await queryAll<{ id: string; name: string; email: string; avatar_url: string }>(
      `SELECT id, name, email, avatar_url FROM users
       WHERE id != ? AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)
       LIMIT 10`,
      [currentUserId, `%${query}%`, `%${query}%`]
    );

    res.json({
      users
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
