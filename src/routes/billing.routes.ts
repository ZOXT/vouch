import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { createCheckout } from "../controllers/subscription.controller";

const router = Router();

router.post("/checkout", protect, createCheckout);

export default router;
