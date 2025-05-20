import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "user",
    },
    mainrole: {
      type: String,
      default: "user",
    },
    subscription: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
      },
    ],
    lastWatchedLecture: {
      type: Map,
      of: {
        lectureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture"
        },
        timestamp: {
          type: Number,
          default: 0
        }
      },
      default: new Map()
    },
    receiptSent: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", schema);
