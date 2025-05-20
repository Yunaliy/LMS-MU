import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  generateCertificate,
  getCertificate,
  verifyCertificate,
} from "../controllers/certificateController.js";

const router = express.Router();

// Get certificate (view/download)
router.get("/:courseId", isAuth, getCertificate);

// Generate certificate
router.post("/generate/:courseId", isAuth, generateCertificate);

// Verify certificate
router.get("/verify/:certificateId", verifyCertificate);

export default router; 