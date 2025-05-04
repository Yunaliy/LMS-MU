import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/User.js";
// import fsPromises from 'fs/promises';
// import path from 'path';
// import { createNotification } from "./Notification.js";




const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(
    lectures.map(async (lecture) => {
      await unlinkAsync(lecture.video);
      console.log("video deleted");
    })
  );

  rm(course.image, () => {
    console.log("image deleted");
  });

  await Lecture.find({ course: req.params.id }).deleteMany();

  await course.deleteOne();

  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({
    message: "Course Deleted",
  });
});

export const getAllStats = TryCatch(async (req, res) => {
  try {
    console.log("Fetching dashboard statistics...");
    
    const [totalCourses, totalLectures, totalUsers] = await Promise.all([
      Courses.countDocuments(),
      Lecture.countDocuments(),
      User.countDocuments()
    ]);

    console.log("Statistics fetched successfully:", {
      totalCourses,
      totalLectures,
      totalUsers
    });

  const stats = {
      totalCourses,
    totalLectures,
    totalUsers,
  };

    res.status(200).json({
      success: true,
    stats,
  });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
});

export const getAllUser = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "-password"
  );

  res.json({ users });
});

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin")
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  const user = await User.findById(req.params.id);

  if (user.role === "user") {
    user.role = "admin";
    await user.save();

    return res.status(200).json({
      message: "Role updated to admin",
    });
  }

  if (user.role === "admin") {
    user.role = "user";
    await user.save();

    return res.status(200).json({
      message: "Role updated",
    });
  }
});




// Helper function to determine file type
function getFileType(mimetype) {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('powerpoint')) return 'ppt';
  if (mimetype.includes('word')) return 'doc';
  return 'video'; // default to video
}
