import dotenv from "dotenv";
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

if (!jwtSecret) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export const authConfig = {
  jwtSecret,
  jwtExpiresIn,
};
