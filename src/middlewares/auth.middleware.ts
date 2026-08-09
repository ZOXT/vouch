import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    req.user = decoded as {
      id: string;
      role: string;
    };
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }
};
