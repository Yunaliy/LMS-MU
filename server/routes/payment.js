import express from "express";
import { initializePayment, verifyEnrollment, getPaymentReports } from "../controllers/payment.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/initialize", isAuth, initializePayment);
router.post("/verify-enroll", isAuth, verifyEnrollment);
router.get("/reports", isAuth, isAdmin, getPaymentReports);

export default router; 