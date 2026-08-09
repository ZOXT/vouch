import { Router } from "express";
import { searchTestimonials } from "../controllers/search.controller";
import {  protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", protect, searchTestimonials);

export default router;
