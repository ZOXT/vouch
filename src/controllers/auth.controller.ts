import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  res.status(200).json(new ApiResponse(200, result, "Login successful"));
});