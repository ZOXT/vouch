import { Router } from "express";
import { validate } from "../middlewares/validate";
import { getUploadUrlSchema } from "../validators/testimonial.validator";
import { getUploadUrl, confirmUpload } from "../controllers/testimonial.controller";
import { confirmUploadSchema } from "../validators/testimonial.validator";

const router = Router()

router.post("/get-upload-url",validate(getUploadUrlSchema), getUploadUrl);
router.post("/confirm-upload", validate(confirmUploadSchema), confirmUpload);

export default router;