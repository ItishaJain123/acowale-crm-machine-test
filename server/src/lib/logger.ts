import pino from "pino";

// Structured JSON logger. In development we pretty-print for readability;
// in production we emit raw JSON that log aggregators can parse.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
