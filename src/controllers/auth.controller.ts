import { Request, Response } from "express";
import { registerUser, loginUser, verifyEmail } from "../services/auth.service";
import { createAndSendOTP } from "../services/otp.service";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, "Account created. Please verify your email."));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  if (result.requiresVerification) {
    res.status(200).json(new ApiResponse(200, result, "Please verify your email"));
    return;
  }
  res.cookie("access_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.status(200).json(new ApiResponse(200, { user: result.user }, "Login successful"));
});

export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  const result = await verifyEmail(userId, otp);
  res.cookie("access_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.status(200).json(new ApiResponse(200, { user: result.user }, "Email verified successfully"));
});

export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.is_verified) {
    throw new ApiError(400, "Email already verified");
  }
  await createAndSendOTP(user.id, user.email, user.name);
  res.status(200).json({ message: "OTP sent successfully" });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.status(200).json({ message: "Logged out successfully" });
});