import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { bucketByDay } from "../lib/trend";

const router = Router();

// GET /api/analytics — admin: summary powering the dashboard.
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, byCategory, recent, avgRating, last7Days] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({
        by: ["category"],
        _count: { _all: true },
        orderBy: { _count: { category: "desc" } },
      }),
      prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
      prisma.feedback.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const trend = bucketByDay(
      last7Days.map((f) => f.createdAt),
      7
    );

    res.json({
      total,
      categoryDistribution: byCategory.map((c) => ({
        category: c.category,
        count: c._count._all,
      })),
      recent,
      averageRating: avgRating._avg.rating,
      trend,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
