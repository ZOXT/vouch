import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";

export const register = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const user = await registerUser(req.body);
        res.status(201).json(new ApiResponse(201, user, "User Registered successfully"))
        
    } catch (err) {
        next(err)
        
    }

};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(new ApiResponse(200, result, "Login successful"));
  } catch (err) {
    next(err);
  }
};