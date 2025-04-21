import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/User.js";
import fsPromises from 'fs/promises';
import path from 'path';
import { createNotification } from "./Notification.js";

export const createCourse = TryCatch(async (req, res) => {
  try {
    console.log("Creating new course with data:", req.body);
    console.log("File information:", req.file);
    
    const { title, description, category, createdBy, duration, price } = req.body;

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({
        success: false,
        message: "Please upload a course image"
      });
    }

    // Clean the file path to store only the relative path
    const imagePath = path.relative('server/uploads', req.file.path) // Get relative path from 'server/uploads'
    .replace(/\\/g, '/'); // Normalize Windows backslashes to forward slashes

console.log("Processed image path:", imagePath);

    const course = await Courses.create({
      title,
      description,
      category,
      createdBy,
      image: imagePath,
      duration: Number(duration),
      price: Number(price),
    });

     // Create notification for all users
  await createNotification(
    "course",
    "New Course Available",
    `New course added: ${course.title}`,
    course._id
  );

    console.log("Course created successfully:", course._id);

    res.status(201).json({
      success: true,
      message: "Course Created Successfully",
      course
    });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
        console.log("Deleted uploaded file due to error");
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }

    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Error creating course",
      error: error.message
    });
  }
});

export const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course)
    return res.status(404).json({
      message: "No Course with this id",
    });

  const { title, description } = req.body;

  const file = req.file;

  const lecture = await Lecture.create({
    title,
    description,
    video: file?.path,
    course: course._id,
  });

   // Create notification for users subscribed to this course
   await createNotification(
    "lecture",
    "New Lecture Added",
    `New lecture "${title}" has been added to the course "${course.title}"`,
    lecture._id,
    req.user._id // exclude the admin who created the lecture
  );

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

export const deleteLecture = TryCatch(async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found"
      });
    }

    // Delete the file if it exists
    if (lecture.file) {
      try {
        await fsPromises.unlink(lecture.file);
        console.log("File deleted successfully");
      } catch (error) {
        console.error("Error deleting file:", error);
        // Continue with lecture deletion even if file deletion fails
      }
    }

    await lecture.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lecture Deleted Successfully"
    });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting lecture",
      error: error.message
    });
  }
});

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
  const totalCoures = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = {
    totalCoures,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
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

export const updateCourse = TryCatch(async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, category, createdBy, duration, price } = req.body;

    // Find the existing course
    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Update fields if they are provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (createdBy) course.createdBy = createdBy;
    if (duration) course.duration = Number(duration);
    if (price) course.price = Number(price);

    // Handle image update if a new file is uploaded
    if (req.file) {
      // Delete old image if it exists
      const oldImagePath = course.image;
      if (oldImagePath) {
        const fullPath = `server/uploads/${oldImagePath}`;
        try {
          await fsPromises.unlink(fullPath);
          console.log("Old image deleted");
        } catch (unlinkError) {
          console.error("Error deleting old image:", unlinkError);
        }
      }

      // Update with new image path
      const imagePath = req.file.path
        .split('uploads')[1]
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
      course.image = imagePath;
    }

    // Save the updated course
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course Updated Successfully",
      course
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course",
      error: error.message
    });
  }
});

export const updateLecture = TryCatch(async (req, res) => {
  try {
    const lectureId = req.params.id;
    const { title, description } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found"
      });
    }

    // Update basic fields
    if (title) lecture.title = title;
    if (description) lecture.description = description;

    // Handle file update if new file is uploaded
    if (req.file) {
      // Delete old file if it exists
      if (lecture.file) {
        try {
          await fsPromises.unlink(lecture.file);
          console.log("Old file deleted");
        } catch (error) {
          console.error("Error deleting old file:", error);
        }
      }

      // Update with new file
      lecture.file = req.file.path;
      lecture.fileType = getFileType(req.file.mimetype);
    }

    await lecture.save();

    res.status(200).json({
      success: true,
      message: "Lecture Updated Successfully",
      lecture
    });
  } catch (error) {
    console.error("Error updating lecture:", error);
    res.status(500).json({
      success: false,
      message: "Error updating lecture",
      error: error.message
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
