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
import Course from "../models/Course.js";
import { Rating } from "../models/Rating.js";

const router = express.Router();

// Public routes
router.get("/course/all", getAllCourses);

// Get top rated courses - This must come BEFORE the /:id route
router.get("/course/top-rated", async (req, res) => {
  try {
    // First try to get courses with ratings
    const coursesWithRatings = await Course.aggregate([
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "course",
          as: "ratings"
        }
      },
      {
        $addFields: {
          averageRating: { $avg: "$ratings.rating" },
          ratingCount: { $size: "$ratings" }
        }
      },
      {
        $match: {
          ratingCount: { $gt: 0 }
        }
      },
      {
        $sort: {
          averageRating: -1,
          ratingCount: -1
        }
      },
      {
        $limit: 10
      }
    ]);

    // If no courses with ratings, get some popular courses
    if (coursesWithRatings.length === 0) {
      const popularCourses = await Course.find()
        .sort({ numberOfRatings: -1, averageRating: -1 })
        .limit(10)
        .lean();

      // Add default rating values for courses without ratings
      const courses = popularCourses.map(course => ({
        ...course,
        averageRating: course.averageRating || 0,
        ratingCount: course.numberOfRatings || 0
      }));

      return res.status(200).json({
        success: true,
        courses
      });
    }

    res.status(200).json({
      success: true,
      courses: coursesWithRatings
    });
  } catch (error) {
    console.error("Error in top-rated courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top rated courses",
      error: error.message
    });
  }
});

// Single course route - This must come AFTER the top-rated route
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
