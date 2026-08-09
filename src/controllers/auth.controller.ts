import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.cookie(
    "access_token",
    result.token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  );

  res.status(200).json(new ApiResponse(200, { user: result.user }, "Login successful"));
});

export const logout = (
  req: Request,
  res: Response
) => {
  res.clearCookie(
    "access_token",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    }
  );

  res.status(200).json({
    message: "Logged out successfully"
  });
};