import Course from "../models/Course.js";
import { createError } from "../utils/error.js";
import cloudinary from "cloudinary";
import fs from "fs";
import getDataUri from "../utils/dataUri.js";

export const addLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, videoSource, youtubeVideoId, isFreePreview } = req.body;

    const course = await Course.findById(id);
    if (!course) return next(createError(404, "Course not found"));

    let fileUrl = null;

    if (videoSource === 'youtube') {
      if (!youtubeVideoId) {
        return next(createError(400, "YouTube video ID is required"));
      }
      fileUrl = youtubeVideoId;
    } else {
      if (!req.file) {
        return next(createError(400, "Please upload a file"));
      }

      const fileUri = getDataUri(req.file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
        resource_type: "auto",
      });

      fileUrl = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    course.lectures.push({
      title,
      description,
      video: {
        source: videoSource,
        url: fileUrl
      },
      isFreePreview: isFreePreview || false
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture added successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, isFreePreview, videoSource, youtubeVideoId } = req.body;
    const lectureId = req.query.lectureId;

    const course = await Course.findById(id);
    if (!course) return next(createError(404, "Course not found"));

    const lecture = course.lectures.id(lectureId);
    if (!lecture) return next(createError(404, "Lecture not found"));

    // Update basic info
    lecture.title = title;
    lecture.description = description;
    lecture.isFreePreview = isFreePreview;

    // Handle video update if provided
    if (videoSource) {
      if (videoSource === 'youtube' && youtubeVideoId) {
        // Update to YouTube video
        if (lecture.video.source !== 'youtube') {
          // Delete old file from cloudinary if exists
          if (lecture.video.url?.public_id) {
            await cloudinary.v2.uploader.destroy(lecture.video.url.public_id);
          }
        }
        lecture.video = {
          source: 'youtube',
          url: youtubeVideoId
        };
      } else if (req.file) {
        // Update to new file upload
        // Delete old file if exists
        if (lecture.video.url?.public_id) {
          await cloudinary.v2.uploader.destroy(lecture.video.url.public_id);
        }

        const fileUri = getDataUri(req.file);
        const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
          resource_type: "auto",
        });

        lecture.video = {
          source: 'local',
          url: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          }
        };
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLecture = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const { id: lectureId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return next(createError(404, "Course not found"));

    const lecture = course.lectures.id(lectureId);
    if (!lecture) return next(createError(404, "Lecture not found"));

    // Delete file from cloudinary if it exists
    if (lecture.video.source === 'local' && lecture.video.url?.public_id) {
      await cloudinary.v2.uploader.destroy(lecture.video.url.public_id);
    }

    course.lectures.pull(lectureId);
    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getLecture = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const { id: lectureId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return next(createError(404, "Course not found"));

    const lecture = course.lectures.id(lectureId);
    if (!lecture) return next(createError(404, "Lecture not found"));

    res.status(200).json({
      success: true,
      lecture,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLectures = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return next(createError(404, "Course not found"));

    res.status(200).json({
      success: true,
      lectures: course.lectures,
    });
  } catch (error) {
    next(error);
  }
}; 