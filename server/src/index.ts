import "dotenv/config";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import feedbackRouter from "./routes/feedback";
import analyticsRouter from "./routes/analytics";

// Fail fast if critical env vars are missing — better than crashing at runtime.
for (const key of ["DATABASE_URL", "JWT_SECRET"]) {
  if (!process.env[key]) {
    logger.fatal(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.set("trust proxy", 1); // behind Render/Vercel proxy — needed for rate limiting by real IP
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/analytics", analyticsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  logger.info(`API server listening on port ${port}`);
});
