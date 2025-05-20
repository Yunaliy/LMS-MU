import express from "express";
import {
  getAllCourses,
  getSingleCourse,
  getMyCourses,
  checkout,
  paymentVerification,
  createCourse,
  updateCourse,
  deleteCourse,
  addOrUpdateRating,
  getMyCourseRating,
  deleteMyCourseRating
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

// Rating routes (require authentication)
router.post("/course/:courseId/rating", isAuth, addOrUpdateRating);
router.get("/course/:courseId/rating/my", isAuth, getMyCourseRating);
router.delete("/course/:courseId/rating/my", isAuth, deleteMyCourseRating);

export default router;
