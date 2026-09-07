import { Router } from "express";
import { handlePaddleWebhook } from "../controllers/subscription.controller";
import { paddleIpAllowlist } from "../middlewares/paddle-ip-allowlist.middleware";

const router = Router();

// The raw JSON body is required for signature verification and is mounted
// before express.json() in index.ts. Only Paddle's documented IP ranges may
// hit this endpoint.
router.post("/paddle", paddleIpAllowlist, handlePaddleWebhook);

export default router;