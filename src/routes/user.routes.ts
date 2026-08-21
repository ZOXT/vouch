import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  getMe,
  getAvatarUrl,
  confirmAvatar,
  updatePassword,
  updateUserProfile
} from "../controllers/user.controller";
import {
  updateProfileSchema,
  generateAvatarUploadUrlSchema,
  confirmAvatarUploadSchema,
  changePasswordSchema,
} from "../validators/user.validator";

const router = Router();

router.use(protect);

router.get("/me", getMe);

router.patch("/me/profile", validate(updateProfileSchema), updateUserProfile);

router.post("/me/avatar/upload-url", validate(generateAvatarUploadUrlSchema), getAvatarUrl);

router.patch("/me/avatar", validate(confirmAvatarUploadSchema), confirmAvatar);

router.patch("/me/password", validate(changePasswordSchema), updatePassword);


export default router;