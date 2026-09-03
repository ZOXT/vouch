import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../config/prisma";

export const protect = async (
 req: Request,
 res: Response,
 next: NextFunction
) => {

  const token = req.cookies.access_token;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    const tokenUser = decoded as {
      id:string;
      role:string;
    };

    const user = await prisma.user.findFirst({
      where: { id: tokenUser.id, deleted_at: null },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;

    next();

  } catch(error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401,"Invalid or expired token");
  }
};
