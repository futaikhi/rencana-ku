import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { queryOne } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "plancraft-super-secure-jwt-secret-key";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  is_demo?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication token required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const rawUser = await queryOne<{
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
      bio?: string;
      is_demo?: number | boolean;
    }>(
      "SELECT id, name, email, avatar_url, bio, is_demo FROM users WHERE id = ?",
      [payload.id]
    );

    if (!rawUser) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    req.user = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      avatar_url: rawUser.avatar_url,
      bio: rawUser.bio,
      is_demo: Boolean(rawUser.is_demo),
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
}
