import { Router } from "express";
import { RequestTestimonial } from "../controllers/testimonial-request.controller";
import { getRequestByToken } from "../controllers/testimonial-request.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";
import { createTestimonialRequestSchema } from "../validators/testimonial-request.validator";


const router = Router();
router.post("/", protect, strictRateLimit, validate(createTestimonialRequestSchema),RequestTestimonial);
router.get("/r/:token",strictRateLimit, getRequestByToken);

export default router   