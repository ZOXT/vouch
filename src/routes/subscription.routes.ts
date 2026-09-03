import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getSubscription } from "../controllers/subscription.controller";

const router = Router();

router.get("/", protect, getSubscription);

export default router;
