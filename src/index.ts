import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import pool from "./config/db";
import "./config/env";

import { logger } from "./config/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/not-found.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";

import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import testimonialRequestRouter from "./routes/testimonial-request.routes";
import testimonialRouter from "./routes/testimonial.routes";
import searchRoutes from "./routes/search.routes";
import embedSectionRoutes from "./routes/embed-section.routes";
import embedRouter from "./routes/embed.routes";
import campaignRoutes from "./routes/campaign.routes"

const app = express();

// Trust the first proxy hop (nginx, Render, Railway, etc.) so req.ip reflects
// the real client IP for rate limiting and login lockouts.
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/testimonial-requests", testimonialRequestRouter);
app.use("/api/v1/testimonials", testimonialRouter);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/embed-sections",embedSectionRoutes);
app.use("/", embedRouter);
app.use("/api/v1/campaigns", campaignRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  pool
    .query("SELECT NOW()")
    .then(() => logger.info("Database connected"))
    .catch((err) => logger.error({ err }, "Database connection failed"));
});
