import { Router } from "express";
import { register, login, logout, verifyEmailController, resendOTP } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.post("/register", authRateLimit, validate(registerSchema), register);
router.post("/login", authRateLimit, validate(loginSchema), login);
router.post("/verify-email", authRateLimit, verifyEmailController);
router.post("/resend-otp", authRateLimit, resendOTP);
router.post("/logout", logout);

export default router;