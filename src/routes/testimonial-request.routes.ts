import { Router } from "express";
import { RequestTestimonial } from "../controllers/testimonial-request.controller";
import { getRequestByToken, listRequests, resendRequest } from "../controllers/testimonial-request.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";
import { createTestimonialRequestSchema } from "../validators/testimonial-request.validator";


const router = Router();
router.post("/", protect, strictRateLimit, validate(createTestimonialRequestSchema),RequestTestimonial);
router.get("/", protect, listRequests);
router.post("/:id/resend", protect, resendRequest);
router.get("/r/:token",strictRateLimit, getRequestByToken);

export default router   