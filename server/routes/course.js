import express from "express";
import {
  getAllCourses,
  getPublishedCourses,
  getSingleCourse,
  getMyCourses,
  checkout,
  paymentVerification,
  createCourse,
  updateCourse,
  deleteCourse,
  addOrUpdateRating,
  getMyCourseRating,
  deleteMyCourseRating,
  togglePublish,
  getTopRatedCourses
} from "../controllers/course.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import Course from "../models/Course.js";
import { Rating } from "../models/Rating.js";

const router = express.Router();

// Public routes - specific routes first
router.get("/courses/published", getPublishedCourses);
router.get("/course/top-rated", getTopRatedCourses);

// Admin route for fetching all courses - requires auth and admin middleware
router.get("/course/all", isAuth, isAdmin, getAllCourses);

// Parameterized routes after specific routes
router.get("/course/:id", getSingleCourse);

// User routes - require authentication
router.get("/mycourse", isAuth, getMyCourses);
router.post("/course/checkout/:id", isAuth, checkout);
router.post("/verification/:id", isAuth, paymentVerification);

// Admin routes - require admin access
router.post("/admin/course/new", isAuth, isAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'material', maxCount: 1 }
]), createCourse);

router.put("/course/:id", isAuth, isAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'material', maxCount: 1 }
]), updateCourse);

router.delete("/course/:id", isAuth, isAdmin, deleteCourse);
router.put("/course/:id/publish", isAuth, isAdmin, togglePublish);

// Rating routes (require authentication)
router.post("/course/:courseId/rating", isAuth, addOrUpdateRating);
router.get("/course/:courseId/rating/my", isAuth, getMyCourseRating);
router.delete("/course/:courseId/rating/my", isAuth, deleteMyCourseRating);

export default router;
