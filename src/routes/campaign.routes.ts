import { Router } from "express";
import {
  createCampaignController,
  deleteCampaignController,
  getCampaignController,
  getCampaignUploadUrlController,
  getPublicCampaignController,
  listCampaignsController,
  submitCampaignTestimonialController,
  updateCampaignController,
} from "../controllers/campaign.controller";
import { protect } from "../middlewares/auth.middleware";
import { strictRateLimit } from "../middlewares/rate-limit.middleware";
import { validate } from "../middlewares/validate";
import {
  createCampaignSchema,
  getCampaignUploadUrlSchema,
  submitCampaignTestimonialSchema,
  updateCampaignSchema,
} from "../validators/campaign.validator";

const router = Router();

// Public routes are deliberately separate from authenticated campaign management.
router.get("/public/:slug", strictRateLimit, getPublicCampaignController);
router.post(
  "/public/:slug/upload-url",
  strictRateLimit,
  validate(getCampaignUploadUrlSchema),
  getCampaignUploadUrlController,
);
router.post(
  "/public/:slug/submissions",
  strictRateLimit,
  validate(submitCampaignTestimonialSchema),
  submitCampaignTestimonialController,
);

router.post("/", protect, validate(createCampaignSchema), createCampaignController);
router.get("/", protect, listCampaignsController);
router.get("/:id", protect, getCampaignController);
router.patch("/:id", protect, validate(updateCampaignSchema), updateCampaignController);
router.delete("/:id", protect, deleteCampaignController);

export default router;
