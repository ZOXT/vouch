import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomUUID();

  req.headers["x-request-id"] = requestId;
  (req as Request & { requestId?: string }).requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      },
      "Request completed",
    );
  });

  next();
};
