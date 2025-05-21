import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
// import crypto from "crypto";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";
import { Rating } from "../models/Rating.js";
import fs from "fs";
import { createNotification } from "./Notification.js";
import path from "path";
import { promises as fsPromises } from 'fs';
import  Assessment  from "../models/Assessment.js";

export const getPublishedCourses = TryCatch(async (req, res) => {
  try {
    // Only fetch published courses
    const courses = await Courses.find({ published: true })
      .lean()
      .select('-__v');

    // Get basic course details without sensitive information
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const [lectures, assessment] = await Promise.all([
          Lecture.find({ course: course._id })
            .select('title isPreview')
            .lean(),
          Assessment.findOne({ courseId: course._id })
            .select('title')
            .lean(),
        ]);

        return {
          ...course,
          lectures: lectures.map(lecture => ({
            title: lecture.title,
            isPreview: lecture.isPreview
          })),
          hasAssessment: Boolean(assessment),
          averageRating: course.averageRating || 0,
          numberOfRatings: course.numberOfRatings || 0
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithDetails,
      meta: {
        count: coursesWithDetails.length
      }
    });
  } catch (error) {
    console.error("Error in getPublishedCourses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching published courses",
      error: error.message
    });
  }
});

export const getAllCourses = TryCatch(async (req, res) => {
  try {
    // Check if user exists and has admin role
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Base query - admin sees all, regular users see only published
    const baseQuery = isAdmin ? {} : { published: true };
    
    // Get courses with lean() for better performance
    const courses = await Courses.find(baseQuery)
      .lean()
      .select('-__v'); // Exclude version key

    // Use Promise.all with populate for better performance
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const [lectures, assessment] = await Promise.all([
          Lecture.find({ course: course._id }).select('-__v'),
          Assessment.findOne({ courseId: course._id }).select('-__v'),
        ]);

        return {
          ...course,
          lectures,
          assessment: assessment || null, // Ensure assessment is null if not found
          averageRating: course.averageRating || 0,
          numberOfRatings: course.numberOfRatings || 0,
          // For frontend convenience, add flags about publish status
          canPublish: isAdmin ? Boolean(lectures.length && assessment) : undefined
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithDetails,
      meta: {
        count: coursesWithDetails.length,
        isAdmin: isAdmin
      }
    });
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
});

export const getSingleCourse = TryCatch(async (req, res) => {
  // Explicitly select averageRating and numberOfRatings
  const course = await Courses.findById(req.params.id).select('+averageRating +numberOfRatings');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // Fetch lectures for this course
  const lectures = await Lecture.find({ course: req.params.id });
  
  // Add lectures and rating info to the course object
  const courseWithLectures = {
    ...course.toObject(),
    lectures: lectures,
    averageRating: course.averageRating,
    numberOfRatings: course.numberOfRatings,
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

    // Find or create progress record
    let progress = await Progress.findOne({
      user: req.user._id,
      course: course
    });

    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        course: course,
        completedLectures: [lectureId]
      });
    } else {
      // If progress exists, check if lecture is already completed
      if (!progress.completedLectures.includes(lectureId)) {
        progress.completedLectures.push(lectureId);
        await progress.save();
      }
    }

    // Fetch updated progress with populated fields
    const updatedProgress = await Progress.findOne({
      user: req.user._id,
      course: course
    }).populate('completedLectures');

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      progress: updatedProgress
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
  try {
    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.query.course,
    });

    const allLectures = await Lecture.find({ course: req.query.course });
    const totalLectures = allLectures.length;

    if (!progress) {
      return res.json({
        courseProgressPercentage: 0,
        completedLectures: 0,
        allLectures: totalLectures,
        progress: [],
        message: "null"
      });
    }

    const completedLectures = progress.completedLectures.length;
    const courseProgressPercentage = totalLectures > 0 
      ? Math.round((completedLectures * 100) / totalLectures) 
      : 0;

    res.json({
      courseProgressPercentage,
      completedLectures,
      allLectures: totalLectures,
      progress: [progress],
    });
  } catch (error) {
    console.error("Error in getYourProgress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get progress",
      error: error.message
    });
  }
});

export const createCourse = TryCatch(async (req, res) => {
  try {
    const { title, description, price, duration, subtitle, category, createdBy } = req.body;
    const image = req.files?.image?.[0];
    const material = req.files?.material?.[0];

    // Validate required fields
    if (!title || !description || !price || !duration) {
      if (image) await fsPromises.unlink(image.path);
      if (material) await fsPromises.unlink(material.path);
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
      image: image ? (image.path.replace(/\\/g, '/').split('uploads/').pop()) : undefined,
      material: material ? (material.path.replace(/\\/g, '/').split('uploads/').pop()) : undefined
    };

    // Create the course
    const course = await Courses.create(courseData);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course
    });
  } catch (error) {
    if (req.files?.image?.[0]) {
      await fsPromises.unlink(req.files.image[0].path);
    }
    if (req.files?.material?.[0]) {
      await fsPromises.unlink(req.files.material[0].path);
    }
    throw error;
  }
});

export const updateCourse = TryCatch(async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, price, duration, subtitle, category, createdBy } = req.body;
    const image = req.files?.image?.[0];
    const material = req.files?.material?.[0];

    const course = await Courses.findById(courseId);
    if (!course) {
      if (image) await fsPromises.unlink(image.path);
      if (material) await fsPromises.unlink(material.path);
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
      course.image = image.path.replace(/\\/g, '/').split('uploads/').pop();
    }

    // Handle material update
    if (material) {
      // Delete old material if it exists
      if (course.material) {
        const oldMaterialPath = path.join(process.cwd(), 'uploads', course.material);
        try {
          await fsPromises.unlink(oldMaterialPath);
        } catch (error) {
          console.error('Error deleting old material:', error);
        }
      }
      course.material = material.path.replace(/\\/g, '/').split('uploads/').pop();
    }

    await course.save();

    res.json({
      success: true,
      message: "Course updated successfully",
      course
    });
  } catch (error) {
    if (req.files?.image?.[0]) {
      await fsPromises.unlink(req.files.image[0].path);
    }
    if (req.files?.material?.[0]) {
      await fsPromises.unlink(req.files.material[0].path);
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

// Controller to add or update a course rating
export const addOrUpdateRating = TryCatch(async (req, res) => {
  const { courseId } = req.params;
  const { rating } = req.body;
  const userId = req.user._id;

  // Validate rating value
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5"
    });
  }

  // Check if the user has purchased the course
  const user = await User.findById(userId);
  if (!user || !user.subscription.includes(courseId)) {
    return res.status(403).json({
      success: false,
      message: "You must purchase this course to rate it"
    });
  }

  let existingRating = await Rating.findOne({ user: userId, course: courseId });
  const course = await Courses.findById(courseId);

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  if (existingRating) {
    // Update existing rating
    const oldRating = existingRating.rating;
    existingRating.rating = rating;
    await existingRating.save();

    // Update course average rating
    const totalRating = (course.averageRating * course.numberOfRatings) - oldRating + rating;
    course.averageRating = totalRating / course.numberOfRatings;
  } else {
    // Add new rating
    await Rating.create({
      user: userId,
      course: courseId,
      rating: rating,
    });

    // Update course average rating and number of ratings
    const totalRating = (course.averageRating * course.numberOfRatings) + rating;
    course.numberOfRatings += 1;
    course.averageRating = totalRating / course.numberOfRatings;
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "Rating added/updated successfully",
    averageRating: course.averageRating,
    numberOfRatings: course.numberOfRatings,
  });
});

// Controller to get a user's rating for a course
export const getMyCourseRating = TryCatch(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const rating = await Rating.findOne({ user: userId, course: courseId });

  if (!rating) {
    return res.status(404).json({
      success: false,
      message: "Rating not found",
      rating: null,
    });
  }

  res.status(200).json({
    success: true,
    rating: rating.rating,
  });
});

// Controller to delete a user's rating for a course
export const deleteMyCourseRating = TryCatch(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const ratingToDelete = await Rating.findOneAndDelete({ user: userId, course: courseId });

  if (!ratingToDelete) {
    return res.status(404).json({
      success: false,
      message: "Rating not found"
    });
  }

  const course = await Courses.findById(courseId);

  if (!course) {
     // This case should ideally not happen if the rating existed, but good to handle
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  // Update course average rating and number of ratings
  if (course.numberOfRatings > 1) {
    course.averageRating = 
      ((course.averageRating * course.numberOfRatings) - ratingToDelete.rating) / (course.numberOfRatings - 1);
    course.numberOfRatings -= 1;
  } else {
    // If this was the only rating, reset to 0
    course.averageRating = 0;
    course.numberOfRatings = 0;
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "Rating deleted successfully",
    averageRating: course.averageRating,
    numberOfRatings: course.numberOfRatings,
  });
});

export const updateProgress = TryCatch(async (req, res) => {
  const { courseId, lectureId, timestamp } = req.body;
  const userId = req.user._id;

  if (!courseId || !lectureId) {
    return res.status(400).json({
      success: false,
      message: "Course ID and Lecture ID are required"
    });
  }

  try {
    // Find or create progress record
    let progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      progress = new Progress({
        user: userId,
        course: courseId,
        completedLectures: [],
        lastWatchedLecture: {
          lectureId,
          timestamp: timestamp || 0
        }
      });
    } else {
      // Update last watched lecture
      progress.lastWatchedLecture = {
        lectureId,
        timestamp: timestamp || 0
      };
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      progress
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

export const togglePublish = TryCatch(async (req, res) => {
  const courseId = req.params.id;
  const { published } = req.body;

  const course = await Courses.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }

  // If trying to publish, check requirements
  if (published) {
    // Check for lectures
    const lectureCount = await Lecture.countDocuments({ course: courseId });
    if (lectureCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish course: No lectures found"
      });
    }

    // Check for assessment
    const assessment = await Assessment.findOne({ courseId });
    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish course: No assessment found"
      });
    }

    // If we get here, all requirements are met
    course.published = true;
    await course.save();

    res.json({
      success: true,
      message: "Course published successfully",
      course: {
        ...course.toObject(),
        lectures: await Lecture.find({ course: courseId }),
        assessment
      }
    });
  } else {
    // Unpublishing doesn't require any checks
    course.published = false;
    await course.save();

    res.json({
      success: true,
      message: "Course unpublished successfully",
      course: {
        ...course.toObject(),
        lectures: await Lecture.find({ course: courseId }),
        assessment: await Assessment.findOne({ courseId })
      }
    });
  }
});

export const getTopRatedCourses = TryCatch(async (req, res) => {
  try {
    // Get courses with ratings, sorted by average rating
    const courses = await Courses.find({ 
      published: true,
      averageRating: { $gt: 0 } // Only get courses with ratings
    })
      .sort({ averageRating: -1 })
      .limit(8) // Limit to top 8 courses
      .lean()
      .select('-__v');

    if (!courses || courses.length === 0) {
      return res.status(200).json({
        success: true,
        courses: [],
        message: "No rated courses found"
      });
    }

    // Get basic course details without sensitive information
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const [lectures, assessment] = await Promise.all([
          Lecture.find({ course: course._id })
            .select('title isPreview')
            .lean(),
          Assessment.findOne({ courseId: course._id })
            .select('title')
            .lean(),
        ]);

        return {
          ...course,
          lectures: lectures.map(lecture => ({
            title: lecture.title,
            isPreview: lecture.isPreview
          })),
          hasAssessment: Boolean(assessment),
          averageRating: course.averageRating || 0,
          numberOfRatings: course.numberOfRatings || 0,
          image: {
            url: course.image ? `${process.env.FRONTEND_URL}/uploads/${course.image}` : '/assets/default-course.jpg'
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      courses: coursesWithDetails,
      meta: {
        count: coursesWithDetails.length
      }
    });
  } catch (error) {
    console.error("Error in getTopRatedCourses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top rated courses",
      error: error.message
    });
  }
});


