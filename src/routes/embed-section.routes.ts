import { Router } from "express";
import {  protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  createEmbedSectionController, updateEmbedSectionController, getPublicEmbedSectionController, deleteEmbedSectionController, getEmbedSectionController, listEmbedSectionsController
} from "../controllers/embed-section.controller";
import { createEmbedSectionSchema, updateEmbedSectionSchema } from "../validators/embed-section.validator";
import { embedCors } from "../middlewares/embed-cors.middleware";

const router = Router();

router.post("/", protect, validate(createEmbedSectionSchema), createEmbedSectionController);
router.get("/", protect, listEmbedSectionsController);
router.get("/embed/:publicId", embedCors, getPublicEmbedSectionController);
router.patch("/:id", protect, validate(updateEmbedSectionSchema), updateEmbedSectionController);
router.get("/:id", protect, getEmbedSectionController);
router.delete("/:id", protect, deleteEmbedSectionController);

export default router;
