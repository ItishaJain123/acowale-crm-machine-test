import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

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

    // Bucket last-7-days submissions by day for the trend chart.
    const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      trend.push({
        date: key,
        count: last7Days.filter(
          (f) => f.createdAt.toISOString().slice(0, 10) === key
        ).length,
      });
    }

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
