import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { server } from "../config";
import toast from "react-hot-toast";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(null);
  const [mycourse, setMyCourse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchCourses = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Add cache-busting parameter if force refresh is requested
      const url = force 
        ? `${server}/api/courses/published?t=${Date.now()}`
        : `${server}/api/courses/published`;

      const { data } = await axios.get(url);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      setCourses(data.courses);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourse = useCallback(async (id) => {
    try {
      const { data } = await axios.get(`${server}/api/course/${id}?t=${Date.now()}`);
      setCourse(data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to fetch course details');
    }
  }, []);

  const fetchMyCourse = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found for fetching enrolled courses");
        return;
      }

      const { data } = await axios.get(`${server}/api/mycourse?t=${Date.now()}`, {
        headers: {
          token: token,
        },
      });

      setMyCourse(data.courses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to view your courses");
      }
    }
  }, []);

  const updateCourseStatus = async (courseId, published) => {
    try {
      const { data } = await axios.put(
        `${server}/api/course/${courseId}/publish`,
        { published },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        // Force refresh all course data
        await Promise.all([
          fetchCourses(true), // Force refresh public courses
          fetchMyCourse(),    // Refresh enrolled courses
        ]);

        // Update single course view if it's the current course
        if (course?._id === courseId) {
          await fetchCourse(courseId);
        }

        toast.success(data.message);
        return true;
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      toast.error(error.response?.data?.message || 'Failed to update course status');
      return false;
    }
  };

  const updateCourseRating = (courseId, newRating, numberOfRatings) => {
    // Update in courses list
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course._id === courseId 
          ? { ...course, averageRating: newRating, numberOfRatings }
          : course
      )
    );

    // Update in mycourse list
    setMyCourse(prevMyCourses =>
      prevMyCourses.map(course =>
        course._id === courseId
          ? { ...course, averageRating: newRating, numberOfRatings }
          : course
      )
    );

    // Update in single course view
    if (course?._id === courseId) {
      setCourse(prevCourse => ({
        ...prevCourse,
        averageRating: newRating,
        numberOfRatings
      }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses();
    fetchMyCourse();
  }, [fetchCourses, fetchMyCourse]);

  // Set up polling for course updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchCourses();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchCourses]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        course,
        mycourse,
        loading,
        error,
        lastUpdate,
        fetchCourses,
        fetchCourse,
        fetchMyCourse,
        updateCourseStatus,
        updateCourseRating,
        refreshCourses: () => fetchCourses(true)
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

// For backward compatibility
export const CourseData = () => useContext(CourseContext);

// New hook-based approach
export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses must be used within a CourseContextProvider");
  }
  return context;
};
