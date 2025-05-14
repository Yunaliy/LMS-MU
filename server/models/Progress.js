import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture"
    }]
  },
  {
    timestamps: true,
  }
);

export const Progress = mongoose.model("Progress", schema);
