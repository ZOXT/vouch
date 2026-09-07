import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  createPortalLink,
  getCheckoutContextHandler,
  getCountry,
} from "../controllers/subscription.controller";
import { checkoutContextSchema } from "../validators/billing.validator";

const router = Router();

router.get("/country", getCountry);

router.post("/checkout-context", protect, validate(checkoutContextSchema), getCheckoutContextHandler);

router.get("/portal", protect, createPortalLink);

export default router;