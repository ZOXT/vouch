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
const LOGIN_LOCK_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS_IP = 20;
const LOGIN_IP_LOCK_SECONDS = 60 * 60;

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const checkLoginLock = async (email: string, ip: string) => {
  const normalizedEmail = normalizeEmail(email);
  const lockKey = `login_lock:${normalizedEmail}`;
  const ipLockKey = `login_lock_ip:${ip}`;
  const [locked, ipLocked] = await Promise.all([
    redis.exists(lockKey),
    redis.exists(ipLockKey)
  ]);
  if (locked) {
    throw new ApiError(429, "Too many login attempts. Please try again later.");
  }
  if (ipLocked) {
    throw new ApiError(429, "Too many login attempts from this IP. Please try again later.");
  }
};

const recordFailedLogin = async (email: string, ip: string) => {
  const normalizedEmail = normalizeEmail(email);
  const attemptsKey = `login_attempts:${normalizedEmail}`;
  const ipAttemptsKey = `login_attempts_ip:${ip}`;
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) {
    await redis.expire(attemptsKey, LOGIN_LOCK_SECONDS);
  }
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await redis.set(`login_lock:${normalizedEmail}`, "true", "EX", LOGIN_LOCK_SECONDS);
    await redis.del(attemptsKey);
  }
  const ipAttempts = await redis.incr(ipAttemptsKey);
  if (ipAttempts === 1) {
    await redis.expire(ipAttemptsKey, LOGIN_IP_LOCK_SECONDS);
  }
  if (ipAttempts >= MAX_LOGIN_ATTEMPTS_IP) {
    await redis.set(`login_lock_ip:${ip}`, "true", "EX", LOGIN_IP_LOCK_SECONDS);
    await redis.del(ipAttemptsKey);
  }
};

const clearFailedLogin = async (email: string, ip?: string) => {
  const normalizedEmail = normalizeEmail(email);
  const commands = [redis.del(`login_attempts:${normalizedEmail}`)];
  if (ip) {
    commands.push(redis.del(`login_attempts_ip:${ip}`));
  }
  await Promise.all(commands);
};

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
  // Clear any login attempts after successful verification
  await clearFailedLogin(user.email);
  const token = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
};

export const registerUser = async (data: RegisterInput) => {
  const normalizedEmail = normalizeEmail(data.email);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
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
      email: normalizedEmail,
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

export const loginUser = async (data: LoginInput, ip: string) => {
  const normalizedEmail = normalizeEmail(data.email);
  await checkLoginLock(normalizedEmail, ip);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });
  if (!user) {
    await bcrypt.compare(data.password, env.DUMMY_PASSWORD_HASH);
    await recordFailedLogin(normalizedEmail, ip);
    throw new ApiError(401, "Invalid credentials");
  }
  const validPassword = await bcrypt.compare(data.password, user.password_hash);
  if (!validPassword) {
    await recordFailedLogin(normalizedEmail, ip);
    throw new ApiError(401, "Invalid credentials");
  }
  // Password is correct - clear failed attempts
  await clearFailedLogin(normalizedEmail, ip);
  if (!user.is_verified) {
    try {
      await createAndSendOTP(user.id, user.email, user.name);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 429) {
        // Cooldown active - ignore
      } else {
        throw error;
      }
    }
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