import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map(issue => issue.message);
      return next(new ApiError(400, messages.join(", ")));
    }

    req.body = result.data;
    next();
  };
};