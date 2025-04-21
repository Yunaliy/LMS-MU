import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoSource: {
    type: String,
    enum: ['local', 'youtube'],
    default: 'local'
  },
  youtubeVideoId: {
    type: String,
    required: function() {
      return this.videoSource === 'youtube';
    }
  },
  file: {
    type: String,
    required: function() {
      return this.videoSource === 'local';
    },
  },
  fileType: {
    type: String,
    required: true,
    enum: ['video', 'audio', 'pdf', 'ppt', 'doc'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Courses",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Lecture = mongoose.model("Lecture", schema);
