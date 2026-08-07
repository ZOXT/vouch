import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { authRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.post("/register",authRateLimit, validate(registerSchema), register);
router.post("/login", authRateLimit, validate(loginSchema), login);

export default router;