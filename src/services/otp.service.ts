import crypto from "crypto";
import { redis } from "../config/redis";
import { sendOTPEmail } from "./email.service";
import { ApiError } from "../utils/ApiError";

const OTP_EXPIRY = 180;
const OTP_MAX_ATTEMPTS = 5;

export const resendOTP = async (
  userId: string,
  email: string,
  name: string
) => {

  await createAndSendOTP(
    userId,
    email,
    name
  );

};

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const hashOTP = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const createAndSendOTP = async (userId: string, email: string, name: string) => {
  const cooldownKey = `email_verify_cooldown:${userId}`;
  const cooldownExists = await redis.exists(cooldownKey);
  if (cooldownExists) {
    throw new ApiError(429, "Please wait before requesting another OTP");
  }
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);
  await redis.set(`email_verify:${userId}`, hashedOTP, "EX", OTP_EXPIRY);
  await redis.set(cooldownKey, "true", "EX", OTP_EXPIRY);
  await redis.del(`email_verify_attempts:${userId}`);
  await sendOTPEmail(email, name, otp);
};

export const verifyOTP = async (userId: string, otp: string) => {
  const attemptsKey = `email_verify_attempts:${userId}`;
  const attempts = await redis.get(attemptsKey);
  if (attempts && Number(attempts) >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many invalid attempts. Request a new OTP");
  }
  const storedOTP = await redis.get(`email_verify:${userId}`);
  if (!storedOTP) {
    throw new ApiError(400, "OTP expired or not found");
  }
  const hashedOTP = hashOTP(otp);
  if (hashedOTP !== storedOTP) {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, OTP_EXPIRY);
    throw new ApiError(400, "Invalid OTP");
  }
  await redis.del(`email_verify:${userId}`);
  await redis.del(attemptsKey);
};