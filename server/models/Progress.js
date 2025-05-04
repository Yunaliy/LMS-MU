import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course.lectures"
    }]
  },
  {
    timestamps: true,
  }
);

export const Progress = mongoose.model("Progress", schema);
