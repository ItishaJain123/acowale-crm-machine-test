import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Health check: reports app status + verifies DB connectivity.
// Used by hosting platforms / uptime monitors to know the service is alive.
router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      uptime: process.uptime(),
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      uptime: process.uptime(),
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
