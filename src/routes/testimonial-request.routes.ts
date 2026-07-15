import { Router } from "express";
import { RequestTestimonial } from "../controllers/testimonial-request.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { createTestimonialRequestSchema } from "../validators/testimonial-request.validator";


const router = Router();
router.post("/", protect, validate(createTestimonialRequestSchema),RequestTestimonial);

export default router