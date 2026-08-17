import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

export const notFound: RequestHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};