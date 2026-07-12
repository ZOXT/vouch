import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";


export const protect = (req: Request, res: Response, next: NextFunction) => {
  // 1. get header
  const authHeader = req.headers.authorization;
  // 2. check it exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
  throw new ApiError(401, "Unauthorized");
}
  // 3. extract token
  const token = authHeader.split(" ")[1];
  try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  
  req.user = decoded as { id: string; role: string };

  next();
} catch (err) {
  throw new ApiError(401, "Invalid or expired token");
}
};