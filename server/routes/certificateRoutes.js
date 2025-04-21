import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  generateCertificate,
  getCertificate,
  verifyCertificate,
} from "../controllers/certificateController.js";

const router = express.Router();

// Generate certificate for a student
router.post("/course/:courseId/generate", auth, generateCertificate);

// Get student's certificate
router.get("/course/:courseId", auth, getCertificate);

// Verify certificate (public endpoint)
router.get("/verify/:certificateId", verifyCertificate);

export default router; 