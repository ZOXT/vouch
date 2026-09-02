import { Request, Response } from "express";
import { registerUser, loginUser, verifyEmail, resendVerificationOTP, revokeRefreshToken, rotateRefreshToken } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";


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


const cookieOptions = {
  httpOnly: true,
  // SameSite=None requires Secure, otherwise browsers reject the cookie
  secure: process.env.NODE_ENV === "production" || env.COOKIE_SAME_SITE === "none",
  sameSite: env.COOKIE_SAME_SITE,
};

const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  res.cookie("access_token", token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";

  const result = await loginUser(req.body, ip);

  if (result.requiresVerification) {
    res.status(200).json(new ApiResponse(200, result, "Please verify your email"));
    return;
  }

  if (!result.token || !result.refreshToken) {
    throw new ApiError(500, "Unable to create an authenticated session");
  }

  setAuthCookies(res, result.token, result.refreshToken);

  res.status(200).json(new ApiResponse(200, { user: result.user }, "Login successful"));
});


export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {

  const { userId, otp } = req.body;

  if (!userId || !otp) {
    throw new ApiError(400, "User ID and OTP are required");
  }

  const result = await verifyEmail(userId, otp);

  setAuthCookies(res, result.token, result.refreshToken);

  res.status(200).json(new ApiResponse(200, { user: result.user }, "Email verified successfully"));
});


export const logout = asyncHandler(async (req: Request, res: Response) => {

  await revokeRefreshToken(req.cookies.refresh_token);

  res.clearCookie("access_token", {
    ...cookieOptions,
  });
  res.clearCookie("refresh_token", {
    ...cookieOptions,
  });

  res.status(200).json({ message: "Logged out successfully" });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const result = await rotateRefreshToken(refreshToken);
  setAuthCookies(res, result.token, result.refreshToken);
  res.status(200).json(new ApiResponse(200, { user: result.user }, "Session refreshed"));
});
