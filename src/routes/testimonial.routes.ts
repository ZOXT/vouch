import { Router } from "express";
import { validate } from "../middlewares/validate";
import { getUploadUrlSchema } from "../validators/testimonial.validator";
import { getUploadUrl, confirmUpload } from "../controllers/testimonial.controller";
import { confirmUploadSchema } from "../validators/testimonial.validator";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router()

router.post("/get-upload-url",strictRateLimit,validate(getUploadUrlSchema), getUploadUrl);
router.post("/confirm-upload",strictRateLimit, validate(confirmUploadSchema), confirmUpload);

export default router;