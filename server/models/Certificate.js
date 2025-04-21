import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
    certificateId: {
      type: String,
      unique: true,
      required: true,
    },
    assessmentScore: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["issued", "revoked"],
      default: "issued",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Certificate", certificateSchema); 