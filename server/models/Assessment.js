import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [{
          type: String,
          required: true,
        }],
        correctAnswer: {
          type: Number,
          required: true,
        },
      },
    ],
    timeLimit: {
      type: Number,
      required: true,
      default: 60, // in minutes
    },
    passingScore: {
      type: Number,
      required: true,
      default: 70, // percentage
    },
    results: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: Number,
      passed: Boolean,
      submittedAt: Date,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Assessment", assessmentSchema); 