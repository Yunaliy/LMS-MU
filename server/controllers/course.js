import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";
import fs from "fs";
import { createNotification } from "./Notification.js";
import path from "path";
import fsPromises from "fs/promises";

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  res.json({
    course,
  });
});

export const fetchLectures = TryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lectures });
  }

  if (!user.subscription.includes(req.params.id))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lecture });
  }

  if (!user.subscription.includes(lecture.course))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lecture });
});

export const getMyCourses = TryCatch(async (req, res) => {
  try {
    console.log("Getting courses for user:", req.user._id);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log("User not found:", req.user._id);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("User subscriptions:", user.subscription);

    // Get all courses where the ID is in the user's subscription array
    const courses = await Courses.find({
      _id: { $in: user.subscription }
    });

    console.log("Found enrolled courses:", courses.length);

    res.json({
      success: true,
      courses,
      message: `Found ${courses.length} enrolled courses`
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: error.message
    });
  }
});

export const checkout = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const course = await Courses.findById(req.params.id);

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
      message: "You already have this course",
    });
  }

  const options = {
    amount: Number(course.price * 100),
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  res.status(201).json({
    order,
    course,
  });
});

export const paymentVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.Razorpay_Secret)
    .update(body)
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    const user = await User.findById(req.user._id);

    const course = await Courses.findById(req.params.id);

    user.subscription.push(course._id);

    await Progress.create({
      course: course._id,
      completedLectures: [],
      user: req.user._id,
    });

    await user.save();

    res.status(200).json({
      message: "Course Purchased Successfully",
    });
  } else {
    return res.status(400).json({
      message: "Payment Failed",
    });
  }
});

export const addProgress = TryCatch(async (req, res) => {
  try {
    const { course, lectureId } = req.query;
    
    if (!course || !lectureId) {
      return res.status(400).json({
        success: false,
        message: "Course ID and Lecture ID are required"
      });
    }

    // Verify the lecture exists and belongs to the course
    const lecture = await Lecture.findOne({
      _id: lectureId,
      course: course
    });

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found or does not belong to this course"
      });
    }

    let progress = await Progress.findOne({
      user: req.user._id,
      course: course,
    });

    // If no progress exists, create a new one
    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        course: course,
        completedLectures: [lectureId]
      });
      return res.status(201).json({
        success: true,
        message: "Progress created and lecture marked as completed",
      });
    }

    // If progress exists, check if lecture is already completed
    if (progress.completedLectures.includes(lectureId)) {
      return res.json({
        success: true,
        message: "Progress already recorded for this lecture",
      });
    }

    // Add the lecture to completed lectures
    progress.completedLectures.push(lectureId);
    await progress.save();

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update progress",
      error: error.message
    });
  }
});

export const getYourProgress = TryCatch(async (req, res) => {
  const progress = await Progress.findOne({
    user: req.user._id,
    course: req.query.course,
  });

  if (!progress) {
    const allLectures = (await Lecture.find({ course: req.query.course })).length;
    return res.json({
      courseProgressPercentage: 0,
      completedLectures: 0,
      allLectures,
      progress: [],
      message: "null"
    });
  }

  const allLectures = (await Lecture.find({ course: req.query.course })).length;
  const completedLectures = progress.completedLectures.length;
  const courseProgressPercentage = allLectures > 0 ? (completedLectures * 100) / allLectures : 0;

  res.json({
    courseProgressPercentage,
    completedLectures,
    allLectures,
    progress: [progress],
  });
});

export const addLecture = TryCatch(async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, videoSource, youtubeVideoId } = req.body;
    const file = req.file;

    if (!courseId) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }

    // Verify course exists
    const course = await Courses.findById(courseId);
    if (!course) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Validate required fields based on video source
    if (!title || !description) {
      if (file) await fs.promises.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: "Title and description are required"
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
        description,
        videoSource: 'youtube',
        youtubeVideoId,
        fileType: 'video',
        course: courseId
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
        description,
        file: relativePath,
        fileType,
        videoSource: 'local',
        course: courseId
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
    throw error;
  }
});

export const createCourse = async (req, res) => {
  try {
    // Create the course
    const course = await Courses.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

export const updateLecture = TryCatch(async (req, res) => {
  const lectureId = req.params.id;
  const { title, description, videoSource, youtubeVideoId } = req.body;
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
    lecture.description = description || lecture.description;
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
    throw error;
  }
});
