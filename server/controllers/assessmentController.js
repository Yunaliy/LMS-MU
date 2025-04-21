import Assessment from "../models/Assessment.js";
import { Courses } from "../models/Courses.js";

// Create assessment for a course
export const createAssessment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, questions, timeLimit, passingScore } = req.body;

    // Check if course exists
    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Create new assessment
    const assessment = await Assessment.create({
      courseId,
      title,
      description,
      questions,
      timeLimit,
      passingScore,
    });

    res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get assessment for a course
export const getAssessment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const assessment = await Assessment.findOne({ courseId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit assessment
export const submitAssessment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ courseId });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Calculate score
    let correctAnswers = 0;
    assessment.questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / assessment.questions.length) * 100);
    const passed = score >= assessment.passingScore;

    // Add result to assessment
    assessment.results.push({
      userId,
      score,
      passed,
      submittedAt: new Date(),
    });

    await assessment.save();

    res.status(200).json({
      success: true,
      score,
      passed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get assessment status
export const getAssessmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ courseId });
    if (!assessment) {
      return res.status(200).json({
        success: true,
        isPassed: false,
        score: 0,
        message: "No assessment found for this course"
      });
    }

    // Find the latest result for this user
    const userResult = assessment.results
      .filter(result => result.userId.toString() === userId.toString())
      .sort((a, b) => b.submittedAt - a.submittedAt)[0];

    if (!userResult) {
      return res.status(200).json({
        success: true,
        isPassed: false,
        score: 0,
        message: "Assessment not attempted yet"
      });
    }

    return res.status(200).json({
      success: true,
      isPassed: userResult.passed,
      score: userResult.score,
      message: userResult.passed ? "Assessment passed" : "Assessment not passed"
    });

  } catch (error) {
    console.error("Assessment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching assessment status",
      error: error.message
    });
  }
}; 