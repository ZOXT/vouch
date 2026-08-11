import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { nanoid } from "nanoid";
import { createAndSendOTP, verifyOTP } from "./otp.service";
import { redis } from "../config/redis";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_TIME = 15 * 60;


export const verifyEmail = async (userId: string, otp: string) => {
  const userExists = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }
  if (userExists.is_verified) {
    throw new ApiError(400, "Email already verified");
  }
  await verifyOTP(userId, otp);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { is_verified: true, verified_at: new Date() }
  });
  const token = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
};

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const baseSlug = slugify(data.company_name || data.name);
  const existingSlug = await prisma.user.findUnique({
    where: { slug: baseSlug }
  });
  const slug = existingSlug ? `${baseSlug}-${nanoid(4)}` : baseSlug;
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role,
      company_name: data.company_name,
      slug
    }
  });
    
  await createAndSendOTP(user.id, user.email, user.name);
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const validPassword = await bcrypt.compare(data.password, user.password_hash);
  if (!validPassword) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (!user.is_verified) {
    await createAndSendOTP(user.id, user.email, user.name);
    return {
      requiresVerification: true,
      userId: user.id,
      email: user.email.replace(/(.{2}).+(@.+)/, "$1***$2")
    };
  }
  const token = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
  const { password_hash, ...safeUser } = user;
  return {
    requiresVerification: false,
    token,
    user: safeUser
  };
};