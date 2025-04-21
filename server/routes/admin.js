import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  updateRole,
  updateCourse,
  updateLecture,
} from "../controllers/admin.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Course routes
router.post("/course/new", isAuth, isAdmin, upload.single('image'), createCourse);
router.put("/course/:id", isAuth, isAdmin, upload.single('image'), updateCourse);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);

// Lecture routes
router.post("/lecture/:id", isAuth, isAdmin, upload.single('file'), addLectures);
router.put("/lecture/:id", isAuth, isAdmin, upload.single('file'), updateLecture);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);

// User routes
router.put("/user/:id", isAuth, isAdmin, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);
router.get("/stats", isAuth, isAdmin, getAllStats);

export default router;
