import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.post("/register",authRateLimit, validate(registerSchema), register);
router.post("/login", authRateLimit, validate(loginSchema), login);
router.post("/logout",logout);

export default router;