import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createFeedbackSchema, listFeedbackSchema } from "../lib/schemas";
import { requireAuth } from "../middleware/auth";
import { feedbackLimiter } from "../middleware/rateLimit";

const router = Router();

// POST /api/feedback — public: anyone can submit feedback.
router.post("/", feedbackLimiter, async (req, res, next) => {
  try {
    const data = createFeedbackSchema.parse(req.body);
    const feedback = await prisma.feedback.create({
      data: {
        category: data.category,
        comment: data.comment,
        rating: data.rating ?? null,
        email: data.email || null,
      },
    });
    res.status(201).json({ id: feedback.id, createdAt: feedback.createdAt });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback — admin: list with category filter, search, pagination.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { category, search, page, pageSize } = listFeedbackSchema.parse(req.query);

    const where: Prisma.FeedbackWhereInput = {
      ...(category && { category }),
      ...(search && {
        OR: [
          { comment: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
