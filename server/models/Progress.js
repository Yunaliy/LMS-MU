import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true,
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture"
    }],
    lastWatchedLecture: {
      lectureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
      },
      timestamp: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
  }
);

export const Progress = mongoose.model("Progress", schema);
