import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

// Custom error class so route handlers can throw errors with an HTTP status.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Central error handler — the LAST middleware in the chain.
// Converts every thrown error into a consistent JSON response and
// never leaks stack traces or internal details to the client.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Unknown/unexpected error — log it fully, return a generic message.
  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
}
