import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { loginSchema } from "../lib/schemas";
import { ApiError } from "../middleware/errorHandler";
import { loginLimiter } from "../middleware/rateLimit";

const router = Router();

// POST /api/auth/login — admin login, returns a JWT valid for 8 hours.
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    // Same error for "no user" and "wrong password" — don't leak which emails exist.
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    res.json({ token, admin: { email: admin.email, name: admin.name } });
  } catch (err) {
    next(err);
  }
});

export default router;
