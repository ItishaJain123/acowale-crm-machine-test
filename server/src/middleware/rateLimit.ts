import rateLimit from "express-rate-limit";

// Public feedback form: max 10 submissions per IP per 15 minutes.
// Protects against spam/abuse without hurting genuine users.
export const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

// Login endpoint: max 5 attempts per IP per 15 minutes (brute-force protection).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});
