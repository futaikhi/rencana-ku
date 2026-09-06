import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { queryOne } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "rencanaku-super-secure-jwt-secret-key";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
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

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication token required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = queryOne<AuthenticatedUser>(
      "SELECT id, name, email, avatar_url, bio FROM users WHERE id = ?",
      [payload.id]
    );

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
}
