import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
// import crypto from "crypto";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";
import fs from "fs";
import { createNotification } from "./Notification.js";
import path from "path";
import { promises as fsPromises } from 'fs';

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Fetch lectures for this course
  const lectures = await Lecture.find({ course: req.params.id });
  
  // Add lectures to the course object
  const courseWithLectures = {
    ...course.toObject(),
    lectures: lectures
  };

  res.json({
    success: true,
    course: courseWithLectures
  });
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
  try {
  const user = await User.findById(req.user._id);
  const course = await Courses.findById(req.params.id);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        message: "User or course not found"
      });
    }

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
        message: "You already have this course"
    });
  }

    // Initialize Chapa payment
    const tx_ref = `COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const payload = {
      amount: course.price,
      currency: 'ETB',
      email: user.email,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ').slice(1).join(' ') || 'N/A',
      tx_ref: tx_ref,
      callback_url: `${process.env.FRONTEND_URL}/verify-payment/${course._id}`,
      return_url: `${process.env.FRONTEND_URL}/courses`,
      customization: {
        title: `Payment for ${course.title}`,
        description: `Course enrollment payment for ${course.title}`
      }
    };

    // Make request to Chapa API to initialize payment
    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.status || data.status !== 'success') {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    // Create a payment record in pending state
    await Payment.create({
      chapa_transaction_id: data.data.transaction_id,
      chapa_reference_id: tx_ref,
      amount: course.price,
      currency: 'ETB',
      status: 'created',
      customer_info: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email
      },
      metadata: {
        courseId: course._id,
        userId: user._id
      }
    });

  res.status(201).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        checkout_url: data.data.checkout_url,
        tx_ref: tx_ref
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed',
      error: error.message
    });
  }
});

export const paymentVerification = TryCatch(async (req, res) => {
  try {
    const { tx_ref } = req.body;

    // Find the payment record
    const payment = await Payment.findOne({ chapa_reference_id: tx_ref });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Verify payment status with Chapa
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'success') {
      // Update payment record
      payment.status = 'success';
      payment.payment_method = data.data.payment_method;
      await payment.save();

      // Get user and course from metadata
      const user = await User.findById(payment.metadata.userId);
      const course = await Courses.findById(payment.metadata.courseId);

      if (!user || !course) {
        throw new Error('User or course not found');
      }

      // Add course to user's subscription
    user.subscription.push(course._id);
      await user.save();

      // Create progress record for the course
    await Progress.create({
      course: course._id,
      completedLectures: [],
        user: user._id
    });

      // Create notification
      await createNotification(
        user._id,
        'course',
        'Course Enrollment Successful',
        `You have successfully enrolled in ${course.title}`,
        course._id
      );

      return res.status(200).json({
        success: true,
        message: 'Course purchased successfully'
    });
  } else {
      // Update payment record as failed
      payment.status = 'failed';
      await payment.save();

    return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
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

export const createCourse = TryCatch(async (req, res) => {
  try {
    const { title, description, price, duration, subtitle, category, createdBy } = req.body;
    const image = req.file;

    // Validate required fields
    if (!title || !description || !price || !duration) {
      if (image) await fsPromises.unlink(image.path);
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Create course data object
    const courseData = {
      title,
      description,
      price,
      duration,
      subtitle,
      category,
      createdBy: createdBy || req.user.name,
      image: image ? image.filename : undefined
    };

    // Create the course
    const course = await Courses.create(courseData);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course
    });
  } catch (error) {
    if (req.file) {
      await fsPromises.unlink(req.file.path);
    }
    throw error;
  }
});

export const updateCourse = TryCatch(async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, price, duration, subtitle, category, createdBy } = req.body;
    const image = req.file;

    const course = await Courses.findById(courseId);
    if (!course) {
      if (image) await fsPromises.unlink(image.path);
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Update course fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (price) course.price = price;
    if (duration) course.duration = duration;
    if (subtitle) course.subtitle = subtitle;
    if (category) course.category = category;
    if (createdBy) course.createdBy = createdBy;

    // Handle image update
    if (image) {
      // Delete old image if it exists
      if (course.image) {
        const oldImagePath = path.join(process.cwd(), 'uploads', course.image);
        try {
          await fsPromises.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      course.image = image.filename;
    }

    await course.save();

    res.json({
      success: true,
      message: "Course updated successfully",
      course
    });
  } catch (error) {
    if (req.file) {
      await fsPromises.unlink(req.file.path);
    }
    throw error;
  }
});

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Delete course image if it exists
  if (course.image) {
    const imagePath = path.join(process.cwd(), course.image);
    try {
      await fsPromises.unlink(imagePath);
    } catch (error) {
      console.error('Error deleting course image:', error);
    }
  }

  // Delete all lectures associated with this course
  await Lecture.deleteMany({ course: course._id });

  // Delete the course
  await course.deleteOne();

  res.json({
    success: true,
    message: "Course deleted successfully"
  });
});


