import { Router } from "express";
import { validate } from "../middlewares/validate";
import { getUploadUrlSchema } from "../validators/testimonial.validator";
import { getUploadUrl, listTestimonials,getTestimonial, getCaptions, confirmUpload, publish, deleteTestimonial } from "../controllers/testimonial.controller";
import {  protect } from "../middlewares/auth.middleware";
import { confirmUploadSchema } from "../validators/testimonial.validator";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router()

router.post("/get-upload-url",strictRateLimit,validate(getUploadUrlSchema), getUploadUrl);
router.post("/confirm-upload",strictRateLimit, validate(confirmUploadSchema), confirmUpload);
router.get("/", protect, listTestimonials);
router.get("/:id",protect, getTestimonial);
router.get("/:id/captions", protect, getCaptions);
router.patch("/:id/publish", protect, publish);
router.delete("/:id", protect, deleteTestimonial);

export default router;