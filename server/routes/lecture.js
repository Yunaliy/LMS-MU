import express from "express";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  addLecture,
  updateLecture,
  deleteLecture,
  fetchLecture,
  fetchLectures,
} from "../controllers/lecture.js";
import { addProgress, getYourProgress } from "../controllers/course.js";

const router = express.Router();

// Admin routes (protected)
router.post("/course/:id/lecture", isAuth, isAdmin, upload.single('file'), addLecture);
router.put("/lecture/:id", isAuth, isAdmin, upload.single('file'), updateLecture);
router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);

// Lecture routes (require authentication)
router.get("/lectures/:id", isAuth, fetchLectures);
router.get("/lecture/:id", isAuth, fetchLecture);


//Progress routes (require authentication)
router.post("/user/progress", isAuth, addProgress);
router.get("/user/progress", isAuth, getYourProgress);
// router.post('/user/progress', isAuth, addProgress);
// router.get('/user/progress', isAuth, getYourProgress);
// Add a test route for debugging
router.get("/test", (req, res) => {
  res.json({ message: "Lecture routes are working" });
});

export default router; 