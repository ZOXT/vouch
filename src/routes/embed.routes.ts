import { Router } from "express";
import {
  serveEmbedCaptions,
  serveEmbedLoader,
  serveEmbedPlayer,
  serveEmbedWall,
} from "../controllers/embed.controller";

const router = Router();

router.get("/embed.js", serveEmbedLoader);
router.get("/embed/:publicId", serveEmbedWall);
router.get("/embed/:publicId/player/:testimonialId", serveEmbedPlayer);
router.get("/embed/:publicId/captions/:testimonialId", serveEmbedCaptions);

export default router;
