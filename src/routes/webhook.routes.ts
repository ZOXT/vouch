import { Router } from "express";
import { handlePaddleWebhook } from "../controllers/subscription.controller";

const router = Router();

// The raw JSON body is required for signature verification and is mounted
// before express.json() in index.ts.
router.post("/paddle", handlePaddleWebhook);

export default router;
