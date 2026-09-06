import { Router, Response, Request } from "express";
import { queryOne, queryAll, execute } from "../db.js";
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthRequest } from "../auth.js";
import jwt from "jsonwebtoken";

const router = Router();

function getAppUrl(): string {
  return process.env.APP_URL || `http://localhost:${process.env.PORT || 3010}`;
}

function findOrCreateOAuthUser(email: string, name: string, avatarUrl?: string, provider?: string) {
  const existing = queryOne<{ id: string; name: string; email: string; avatar_url: string; bio: string }>(
    "SELECT id, name, email, avatar_url, bio FROM users WHERE LOWER(email) = LOWER(?)",
    [email]
  );

  if (existing) {
    return existing;
  }

  const id = `oauth_${provider || "oauth"}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const avatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`;

  execute(
    `INSERT INTO users (id, name, email, password_hash, avatar_url, bio, created_at)
     VALUES (?, ?, ?, '', ?, '', ?)`,
    [id, name || email.split("@")[0], email.toLowerCase(), avatar, now]
  );

  return {
    id,
    name: name || email.split("@")[0],
    email: email.toLowerCase(),
    avatar_url: avatar,
    bio: "",
  };
}

// Google OAuth: Step 1 — Redirect user to Google
router.get("/oauth/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = getAppUrl();

  if (!clientId) {
    return res.redirect(`${appUrl}?oauth_error=google_not_configured`);
  }

  const redirectUri = `${appUrl}/api/auth/oauth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  res.redirect(authUrl.toString());
});

// Google OAuth: Step 2 — Handle callback
router.get("/oauth/google/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const appUrl = getAppUrl();

    if (!code) {
      return res.redirect(`${appUrl}?oauth_error=missing_code`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return res.redirect(`${appUrl}?oauth_error=token_exchange_failed`);
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    const safeUser = findOrCreateOAuthUser(googleUser.email, googleUser.name, googleUser.picture, "google");
    const token = generateToken(safeUser);

    res.redirect(302, `${appUrl}/#oauth_token=${token}`);
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    res.redirect(`${getAppUrl()}?oauth_error=${encodeURIComponent(err.message)}`);
  }
});

// Apple OAuth: Step 1 — Redirect user to Apple
router.get("/oauth/apple", (req: Request, res: Response) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const appUrl = getAppUrl();

  if (!clientId || !teamId || !keyId || !privateKey) {
    return res.redirect(`${appUrl}?oauth_error=apple_not_configured`);
  }

  // Generate client secret JWT (ES256)
  const clientSecret = jwt.sign(
    {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      aud: "https://appleid.apple.com",
      sub: `com.rencanaku.service`,
    },
    privateKey,
    {
      algorithm: "ES256",
      keyid: keyId,
    }
  );

  const redirectUri = `${appUrl}/api/auth/oauth/apple/callback`;
  const authUrl = new URL("https://appleid.apple.com/auth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code id_token");
  authUrl.searchParams.set("scope", "name email");
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("state", "rencanaku");

  res.redirect(authUrl.toString());
});

// Apple OAuth: Step 2 — Handle callback
router.post("/oauth/apple/callback", async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query as { code?: string; error?: string };
    const appUrl = getAppUrl();

    if (error) {
      return res.redirect(`${appUrl}?oauth_error=${error}`);
    }
    if (!code) {
      // Apple may POST the code in the body
      const bodyCode = (req.body as any)?.code;
      if (!bodyCode) {
        return res.redirect(`${appUrl}?oauth_error=missing_code`);
      }
    }

    const codeValue = code || (req.body as any)?.code;
    const redirectUri = `${appUrl}/api/auth/oauth/apple/callback`;

    // Generate client secret
    const clientSecret = jwt.sign(
      {
        iss: process.env.APPLE_TEAM_ID!,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
        aud: "https://appleid.apple.com",
        sub: "com.rencanaku.service",
      },
      process.env.APPLE_PRIVATE_KEY!,
      { algorithm: "ES256", keyid: process.env.APPLE_KEY_ID! }
    );

    // Exchange code for token
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: codeValue,
        redirect_uri: redirectUri,
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token && !tokenData.id_token) {
      console.error("Apple token exchange failed:", tokenData);
      return res.redirect(`${appUrl}?oauth_error=token_exchange_failed`);
    }

    // Decode user info from id_token
    const idTokenParts = tokenData.id_token.split(".");
    const decoded = JSON.parse(Buffer.from(idTokenParts[1], "base64").toString());

    const email = decoded.email || "";
    const name = decoded.name || email.split("@")[0];
    const safeUser = findOrCreateOAuthUser(email, name, undefined, "apple");
    const token = generateToken(safeUser);

    res.redirect(302, `${appUrl}/#oauth_token=${token}`);
  } catch (err: any) {
    console.error("Apple OAuth error:", err);
    res.redirect(`${getAppUrl()}?oauth_error=${encodeURIComponent(err.message)}`);
  }
});

// Demo accounts endpoint for rapid evaluation and testing
router.get("/demo-accounts", (_req, res) => {
  try {
    const users = queryAll<{ id: string; name: string; email: string; avatar_url: string; bio: string }>(
      "SELECT id, name, email, avatar_url, bio FROM users ORDER BY name ASC"
    );
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Quick demo login by email (for instant switcher)
router.post("/demo-login", (req, res) => {
  try {
    const { email } = req.body;
    const user = queryOne<{ id: string; name: string; email: string; avatar_url: string; bio: string }>(
      "SELECT id, name, email, avatar_url, bio FROM users WHERE email = ?",
      [email]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post("/register", (req, res) => {
  try {
    const { name, email, password, bio, avatar_url } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = queryOne("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [email.trim()]);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const password_hash = hashPassword(password);
    const now = new Date().toISOString();
    const avatar = avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    execute(
      `INSERT INTO users (id, name, email, password_hash, avatar_url, bio, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), email.trim().toLowerCase(), password_hash, avatar, bio || "", now]
    );

    const newUser = { id, name: name.trim(), email: email.trim().toLowerCase(), avatar_url: avatar, bio: bio || "" };
    const token = generateToken(newUser);

    res.status(201).json({ user: newUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = queryOne<{
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
router.put("/profile", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, avatar_url, bio } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    execute(
      "UPDATE users SET name = ?, avatar_url = ?, bio = ? WHERE id = ?",
      [name.trim(), avatar_url || null, bio || "", userId]
    );

    const updatedUser = queryOne<{ id: string; name: string; email: string; avatar_url: string; bio: string }>(
      "SELECT id, name, email, avatar_url, bio FROM users WHERE id = ?",
      [userId]
    );

    res.json({ user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put("/password", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const user = queryOne<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (!user || !comparePassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const newHash = hashPassword(newPassword);
    execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);

    res.json({ message: "Password updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search users to invite to a plan
router.get("/search", authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string || "").trim().toLowerCase();
    const currentUserId = req.user!.id;

    if (!query) {
      const recentUsers = queryAll<{ id: string; name: string; email: string; avatar_url: string }>(
        "SELECT id, name, email, avatar_url FROM users WHERE id != ? LIMIT 8",
        [currentUserId]
      );
      return res.json({ users: recentUsers });
    }

    const users = queryAll<{ id: string; name: string; email: string; avatar_url: string }>(
      `SELECT id, name, email, avatar_url FROM users 
       WHERE id != ? AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?) 
       LIMIT 10`,
      [currentUserId, `%${query}%`, `%${query}%`]
    );

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
