import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  getAllStats,
  getAllUser,
  updateRole,
} from "../controllers/admin.js";
import { Courses } from "../models/Courses.js";
import { User } from "../models/User.js";

const router = express.Router();

// User routes
router.put("/user/:id", isAuth, isAdmin, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);
router.get("/stats", isAuth, isAdmin, getAllStats);

// Revenue calculation endpoint
router.get("/admin/revenue", isAuth, isAdmin, async (req, res) => {
  try {
    // Get all courses
    const courses = await Courses.find();
    
    // Get all users with subscriptions
    const users = await User.find({ subscription: { $exists: true, $ne: [] } });
    
    // Calculate total revenue
    let totalRevenue = 0;
    let totalPayments = 0;
    let payments = [];
    
    // Create a map to track course enrollments
    const courseEnrollments = new Map();
    
    users.forEach(user => {
      user.subscription.forEach(courseId => {
        const course = courses.find(c => c._id.toString() === courseId.toString());
        if (course) {
          totalRevenue += course.price;
          totalPayments++;
          
          // Track enrollments per course
          const enrollments = courseEnrollments.get(courseId.toString()) || 0;
          courseEnrollments.set(courseId.toString(), enrollments + 1);
          
          // Add to payments array for detailed view
          payments.push({
            course: {
              title: course.title,
              category: course.category,
              createdBy: course.createdBy
            },
            amount: course.price,
            enrollments: enrollments + 1
          });
        }
      });
    });
    
    // Calculate average payment
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    
    // Get unique courses with their total enrollments
    const uniquePayments = Array.from(courseEnrollments.entries()).map(([courseId, enrollments]) => {
      const course = courses.find(c => c._id.toString() === courseId);
      return {
        course: {
          title: course.title,
          category: course.category,
          createdBy: course.createdBy
        },
        amount: course.price * enrollments,
        enrollments: enrollments
      };
    });
    
    res.status(200).json({
      success: true,
      totalRevenue,
      totalPayments,
      averagePayment,
      payments: uniquePayments,
      currency: "ETB"
    });
  } catch (error) {
    console.error("Error calculating revenue:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating revenue"
    });
  }
});

export default router;
