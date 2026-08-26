import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { isEmbedOriginAllowed } from "../utils/embed-domain";

export const embedCors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publicId = req.params.publicId;
    const origin = req.get("origin");

    if (!publicId || Array.isArray(publicId) || !origin || Array.isArray(origin)) {
      return next();
    }

    const section = await prisma.embedSection.findUnique({
      where: { public_id: publicId },
      select: { allowed_domains: true },
    });

    if (!section) return next();

    if (!isEmbedOriginAllowed(origin, section.allowed_domains)) {
      return next(new ApiError(403, "This domain is not allowed to display this embed"));
    }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.vary("Origin");
    return next();
  } catch (error) {
    return next(error);
  }
};
