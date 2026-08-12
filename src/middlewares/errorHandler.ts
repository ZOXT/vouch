import { ApiError } from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (err instanceof ApiError) {

    logger.warn(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: err.statusCode,
        message: err.message,
      },
      "API error"
    );

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }


  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
    },
    "Unhandled server error"
  );


  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};