import jwt from "jsonwebtoken";
import {prisma} from "../config/prisma";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError";



export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role,
      company_name: data.company_name,
      
    },
  });

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN }as jwt.SignOptions 
  );

  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
};
