import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDb } from "./server/db.js";
import authRoutes from "./server/routes/authRoutes.js";
import planRoutes from "./server/routes/planRoutes.js";
import taskRoutes from "./server/routes/taskRoutes.js";
import milestoneRoutes from "./server/routes/milestoneRoutes.js";
import budgetRoutes from "./server/routes/budgetRoutes.js";
import notesRoutes from "./server/routes/notesRoutes.js";
import memberRoutes from "./server/routes/memberRoutes.js";
import invitationRoutes from "./server/routes/invitationRoutes.js";
import activityRoutes from "./server/routes/activityRoutes.js";
import syncRoutes from "./server/routes/syncRoutes.js";

async function startServer() {
  // Initialize SQLite database
  await getDb();

  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "PlanCraft API", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/plans", planRoutes);
  app.use("/api/plans", taskRoutes);
  app.use("/api/plans", milestoneRoutes);
  app.use("/api/plans", budgetRoutes);
  app.use("/api/plans", notesRoutes);
  app.use("/api/plans", memberRoutes);
  app.use("/api/invitations", invitationRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/sync", syncRoutes);

  // Global Error Handler for API
  app.use("/api", (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlanCraft server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
