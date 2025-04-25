import express from "express";
import { initializePayment, verifyEnrollment } from "../controllers/payment.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/initialize", isAuth, initializePayment);
router.post("/verify-enroll", isAuth, verifyEnrollment);

export default router; 