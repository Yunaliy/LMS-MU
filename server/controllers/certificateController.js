import Certificate from "../models/Certificate.js";
import { User } from "../models/User.js";
import { Courses } from "../models/Courses.js";
import Assessment from "../models/Assessment.js";

// Generate certificate for a student
export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Get user and course details
    const user = await User.findById(userId);
    const course = await Courses.findById(courseId);
    const assessment = await Assessment.findOne({ courseId });

    if (!user || !course || !assessment) {
      return res.status(404).json({
        success: false,
        message: "User, course, or assessment not found",
      });
    }

    // Check if student has completed all lectures
    const progress = user.progress.find((p) => p.courseId.toString() === courseId);
    if (!progress || !progress.completed) {
      return res.status(400).json({
        success: false,
        message: "Course not completed",
      });
    }

    // Get assessment result
    const result = assessment.results.find(
      (r) => r.userId.toString() === userId.toString()
    );
    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Assessment not completed",
      });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create certificate
    const certificate = await Certificate.create({
      userId,
      courseId,
      studentName: user.name,
      courseName: course.title,
      certificateId,
      assessmentScore: result.score,
      completionDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Certificate generated successfully",
      certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get student's certificate
export const getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findOne({
      userId,
      courseId,
      status: "issued",
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify certificate
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      certificateId,
      status: "issued",
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Invalid or revoked certificate",
      });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; 