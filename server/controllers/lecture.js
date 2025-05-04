import Course from "../models/Course.js";
import { createError } from "../utils/error.js";
import fs from "fs";
import path from "path";
import { Lecture } from "../models/Lecture.js";
import { createNotification } from "./Notification.js";
import fsPromises from 'fs/promises';
import TryCatch from "../middlewares/TryCatch.js";
import { User } from "../models/User.js";

export const addLecture = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const { title, videoSource, youtubeVideoId, isPreview } = req.body;
    const file = req.file;

    if (!courseId) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Validate required fields based on video source
    if (!title) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    if (videoSource === 'youtube') {
      if (!youtubeVideoId) {
        return res.status(400).json({
          success: false,
          message: "YouTube Video ID is required"
        });
      }

      const lecture = await Lecture.create({
        title,
        videoSource: 'youtube',
        youtubeVideoId,
        fileType: 'video',
        course: courseId,
        isPreview: isPreview || false
      });

      // Create notification
      try {
        await createNotification(
          "lecture",
          "New Lecture Added",
          `New lecture "${title}" has been added to the course "${course.title}"`,
          lecture._id,
          req.user._id
        );
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      return res.status(201).json({
        success: true,
        message: "Lecture added successfully",
        lecture
      });
    } else {
      // Handle local file upload
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "File is required for local upload"
        });
      }

      // Determine file type and folder
      let fileType;
      let folderPath;
      if (file.mimetype.startsWith('video/')) {
        fileType = 'video';
        folderPath = 'lectures';
      } else if (file.mimetype.startsWith('audio/')) {
        fileType = 'audio';
        folderPath = 'others';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
        folderPath = 'others';
      } else {
        fileType = 'other';
        folderPath = 'others';
      }

      // Create the relative path for storage
      const relativePath = `${folderPath}/${path.basename(file.path)}`;

      const lecture = await Lecture.create({
        title,
        file: relativePath,
        fileType,
        videoSource: 'local',
        course: courseId,
        isPreview: isPreview || false
      });

      // Create notification
      try {
        await createNotification(
          "lecture",
          "New Lecture Added",
          `New lecture "${title}" has been added to the course "${course.title}"`,
          lecture._id,
          req.user._id
        );
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      return res.status(201).json({
        success: true,
        message: "Lecture added successfully",
        lecture
      });
    }
  } catch (error) {
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
    next(error);
  }
};

export const updateLecture = async (req, res, next) => {
  const lectureId = req.params.id;
  const { title, videoSource, youtubeVideoId, isPreview } = req.body;
  const file = req.file;
  let oldFilePath = null;

  try {
    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      if (file) await fsPromises.unlink(file.path);
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    if (lecture.videoSource === 'local' && lecture.file) {
      if (videoSource === 'youtube' || (videoSource === 'local' && file)) {
        oldFilePath = path.join(process.cwd(), 'server', lecture.file);
      }
    }

    lecture.title = title || lecture.title;
    lecture.isPreview = isPreview !== undefined ? isPreview : lecture.isPreview;
    lecture.videoSource = videoSource || lecture.videoSource;

    if (lecture.videoSource === 'youtube') {
      if (!youtubeVideoId) {
        if (file) await fsPromises.unlink(file.path);
        return res.status(400).json({ success: false, message: "YouTube Video ID is required for YouTube source" });
      }
      lecture.youtubeVideoId = youtubeVideoId;
      lecture.file = undefined;
      lecture.fileType = 'video';
    } else if (lecture.videoSource === 'local') {
      if (file) {
        lecture.youtubeVideoId = undefined;

        let fileType;
        let folderPath;
        if (file.mimetype.startsWith('video/')) {
          fileType = 'video'; folderPath = 'uploads/lectures';
        } else if (file.mimetype.startsWith('audio/')) {
          fileType = 'audio'; folderPath = 'uploads/others';
        } else if (file.mimetype === 'application/pdf') {
          fileType = 'pdf'; folderPath = 'uploads/others';
        } else {
          fileType = 'other'; folderPath = 'uploads/others';
        }
        await fsPromises.mkdir(path.join(process.cwd(), 'server', folderPath), { recursive: true });
        const relativePath = path.join(folderPath, path.basename(file.path)).replace(/\\/g, '/');

        lecture.file = relativePath;
        lecture.fileType = fileType;
      } else if (!lecture.file) {
        return res.status(400).json({ success: false, message: "File is required for local source" });
      }
    } else {
      if (file) await fsPromises.unlink(file.path);
      return res.status(400).json({ success: false, message: "Invalid video source specified" });
    }

    await lecture.save();

    if (oldFilePath) {
      try {
        await fsPromises.unlink(oldFilePath);
        console.log("Deleted old file:", oldFilePath);
      } catch (unlinkError) {
        console.error("Error deleting old file:", oldFilePath, unlinkError);
      }
    }

    res.json({ success: true, message: "Lecture updated successfully", lecture });

  } catch (error) {
    if (file) {
      try { await fsPromises.unlink(file.path); } catch (unlinkError) { console.error("Error deleting uploaded file on failure:", unlinkError); }
    }
    next(error);
  }
};

export const fetchLectures = TryCatch(async (req, res) => {
  const { id } = req.params;
  console.log("Course ID in fetchLectures:", id);
  console.log("User ID:", req.user?._id);
  console.log("Request headers:", req.headers);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Course ID is required"
    });
  }

  // First verify the course exists
  const course = await Course.findById(id);
  if (!course) {
    console.log("Course not found for ID:", id);
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Get all lectures for this course using the Lecture model
  const lectures = await Lecture.find({ course: id });
  console.log("Found lectures:", lectures.length);

  const user = await User.findById(req.user._id);
  if (!user) {
    console.log("User not found for ID:", req.user._id);
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }

  if (user.role === "admin") {
    console.log("Returning all lectures for admin");
    return res.json({ 
      success: true,
      lectures 
    });
  }

  // For regular users, check if they have access to the course
  if (!user.subscription.includes(id)) {
    console.log("User doesn't have subscription, returning preview lectures");
    // If user hasn't purchased the course, only return preview lectures
    const previewLectures = lectures.filter(lecture => lecture.isPreview);
    return res.json({ 
      success: true,
      lectures: previewLectures 
    });
  }

  console.log("Returning all lectures for subscribed user");
  res.json({ 
    success: true,
    lectures 
  });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found"
    });
  }

  const user = await User.findById(req.user._id);
  if (user.role === "admin") {
    return res.json({ 
      success: true,
      lecture 
    });
  }

  // For regular users, check if they have access
  if (!user.subscription.includes(lecture.course) && !lecture.isPreview) {
    return res.status(403).json({
      success: false,
      message: "You need to purchase this course to access this lecture"
    });
  }

  res.json({ 
    success: true,
    lecture 
  });
});

export const deleteLecture = async (req, res, next) => {
  try {
    const { id: lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) return next(createError(404, "Lecture not found"));

    // If there's a local file, delete it
    if (lecture.videoSource === 'local' && lecture.file) {
      const filePath = path.join(process.cwd(), 'server', lecture.file);
      try {
        await fsPromises.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    await lecture.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}; 