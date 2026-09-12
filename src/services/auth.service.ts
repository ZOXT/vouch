import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { nanoid } from "nanoid";
import { createAndSendOTP, verifyOTP, resendOTP} from "./otp.service";
import { notifyPasswordChanged, notifyPasswordReset } from "./email.service";
import { redis } from "../config/redis";
import crypto from "crypto";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS_IP = 20;
const LOGIN_IP_LOCK_SECONDS = 60 * 60;

const PASSWORD_RESET_EXPIRES_IN_MINUTES = 60;
const REFRESH_REUSE_GRACE_MS = 15 * 1000;

const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

const createAccessToken = (user: { id: string; role: string }) =>
  jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: hashRefreshToken(token),
      expires_at: expiresAt,
    },
  });

  return token;
};

export const resendVerificationOTP = async (
  userId: string
) => {

  const user = await prisma.user.findUnique({
    where:{
      id:userId
    }
  });


  if(!user){
    throw new ApiError(
      404,
      "User not found"
    );
  }


  if(user.is_verified){
    throw new ApiError(
      400,
      "Email already verified"
    );
  }


  await resendOTP(
    user.id,
    user.email,
    user.name
  );


  return {
    message:"Verification code sent"
  };

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
  const userExists = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null }
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
  const token = createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  const { password_hash, ...safeUser } = user;
  return { token, refreshToken, user: safeUser };
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deleted_at: null }
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
  const token = createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  const { password_hash, ...safeUser } = user;
  return {
    requiresVerification: false,
    token,
    refreshToken,
    user: safeUser
  };
};

export const rotateRefreshToken = async (rawToken: string) => {
  const tokenHash = hashRefreshToken(rawToken);
  const replacementToken = crypto.randomBytes(48).toString("base64url");
  const replacementHash = hashRefreshToken(replacementToken);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  );

  const reusedWithinGrace = (entry: {
    revoked_at: Date | null;
  }): boolean =>
    Boolean(
      entry.revoked_at &&
        Date.now() - entry.revoked_at.getTime() < REFRESH_REUSE_GRACE_MS,
    );

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!existing || existing.expires_at <= new Date() || existing.user.deleted_at) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    if (existing.revoked_at) {
      if (reusedWithinGrace(existing)) {
        // The same client almost certainly fired two refreshes in quick
        // succession (StrictMode double effect, multiple tabs). Issue a
        // fresh pair instead of killing every session.
        await tx.refreshToken.create({
          data: {
            user_id: existing.user_id,
            token_hash: replacementHash,
            expires_at: expiresAt,
          },
        });
        return existing.user;
      }

      await tx.refreshToken.updateMany({
        where: { user_id: existing.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new ApiError(401, "Refresh token has already been used");
    }

    const revoked = await tx.refreshToken.updateMany({
      where: { id: existing.id, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    if (revoked.count !== 1) {
      const after = await tx.refreshToken.findUnique({
        where: { token_hash: tokenHash },
        select: { revoked_at: true },
      });

      if (after && reusedWithinGrace(after)) {
        await tx.refreshToken.create({
          data: {
            user_id: existing.user_id,
            token_hash: replacementHash,
            expires_at: expiresAt,
          },
        });
        return existing.user;
      }

      throw new ApiError(401, "Refresh token has already been used");
    }

    await tx.refreshToken.create({
      data: {
        user_id: existing.user_id,
        token_hash: replacementHash,
        expires_at: expiresAt,
      },
    });

    return existing.user;
  });

  const { password_hash, ...safeUser } = user;
  return {
    token: createAccessToken(user),
    refreshToken: replacementToken,
    user: safeUser,
  };
};

export const revokeRefreshToken = async (rawToken?: string) => {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { token_hash: hashRefreshToken(rawToken), revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

export const revokeAllRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

const PASSWORD_RESET_TOKEN_BYTES = 48;

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deleted_at: null },
  });

  // Always return the same response regardless of whether the account exists
  // to avoid leaking which emails are registered.
  if (!user) {
    return;
  }

  const token = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  notifyPasswordReset(user.email, {
    name: user.name,
    resetUrl,
    expiresInMinutes: PASSWORD_RESET_EXPIRES_IN_MINUTES,
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = hashRefreshToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true },
  });

  if (!record || record.user.deleted_at) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  if (record.used_at || record.expires_at <= new Date()) {
    throw new ApiError(400, "This reset link has expired or already been used");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user_id },
      data: { password_hash: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    }),
  ]);

  await revokeAllRefreshTokens(record.user_id);
  notifyPasswordChanged(record.user.email, record.user.name);
};
