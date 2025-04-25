import express from "express";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  addLecture,
  updateLecture,
  deleteLecture,
  getLecture,
  getAllLectures,
} from "../controllers/lecture.js";

const router = express.Router();

// Admin routes (protected)
router.post("/course/:id/lecture", isAuth, isAdmin, upload.single('file'), addLecture);
router.put("/course/:id/lecture", isAuth, isAdmin, upload.single('file'), updateLecture);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);

// Public routes (still requires authentication)
router.get("/course/:id/lectures", isAuth, getAllLectures);
router.get("/lecture/:id", isAuth, getLecture);

export default router; 