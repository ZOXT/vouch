import { ApiError } from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // Log the real error on the SERVER, never send to client
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};