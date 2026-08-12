import { Request, Response } from "express";
import { registerUser, loginUser, verifyEmail, resendVerificationOTP } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";


export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, "Account created. Please verify your email."));
});


export const resendOTP = asyncHandler(async (req: Request, res: Response) => {

  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const result = await resendVerificationOTP(userId);

  res.status(200).json(new ApiResponse(200, result, "OTP resent successfully"));
});


export const login = asyncHandler(async (req: Request, res: Response) => {

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";

  const result = await loginUser(req.body, ip);

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

  if (!userId || !otp) {
    throw new ApiError(400, "User ID and OTP are required");
  }

  const result = await verifyEmail(userId, otp);

  res.cookie("access_token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json(new ApiResponse(200, { user: result.user }, "Email verified successfully"));
});


export const logout = asyncHandler(async (req: Request, res: Response) => {

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  res.status(200).json({ message: "Logged out successfully" });
});