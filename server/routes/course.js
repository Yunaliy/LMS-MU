import express from "express";
import {
  getAllCourses,
  getSingleCourse,
  getMyCourses,
  checkout,
  paymentVerification,
  createCourse,
  updateCourse,
  deleteCourse
} from "../controllers/course.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Public routes
router.get("/course/all", getAllCourses);
router.get("/course/:id", getSingleCourse);

// User routes
router.get("/mycourse", isAuth, getMyCourses);
router.post("/course/checkout/:id", isAuth, checkout);
router.post("/verification/:id", isAuth, paymentVerification);

// Admin routes
router.post("/admin/course/new", isAuth, isAdmin, upload.single('image'), createCourse);
router.put("/course/:id", isAuth, isAdmin, upload.single('image'), updateCourse);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);

export default router;
