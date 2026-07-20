import { z } from "zod";

// Categories mirror the Prisma enum — single source of truth for validation.
export const CATEGORIES = [
  "PRODUCT",
  "BUG",
  "FEATURE_REQUEST",
  "UI_UX",
  "SUPPORT",
  "BILLING",
  "OTHER",
] as const;

export const createFeedbackSchema = z.object({
  category: z.enum(CATEGORIES),
  comment: z
    .string()
    .trim()
    .min(5, "Comment must be at least 5 characters")
    .max(2000, "Comment must be under 2000 characters"),
  rating: z.number().int().min(1).max(5).optional(),
  email: z.string().trim().email("Invalid email").max(254).optional().or(z.literal("")),
});

export const listFeedbackSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});
