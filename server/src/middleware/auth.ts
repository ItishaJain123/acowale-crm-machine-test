import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";

export interface AuthRequest extends Request {
  admin?: { id: string; email: string };
}

// Protects admin-only routes. Expects: Authorization: Bearer <token>
export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
    };
    req.admin = { id: payload.id, email: payload.email };
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}
