import express from "express";
import { extractAudioController, extractVideoController } from "../controller/extraction.controller.js";
const router = express.Router();

router.get("/extract-audio", extractAudioController);
router.get("/extract-video", extractVideoController);

export default router;