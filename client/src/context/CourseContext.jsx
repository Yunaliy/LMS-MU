import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { server } from "../config";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState([]);
  const [mycourse, setMyCourse] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  async function fetchCourses() {
    try {
      const { data } = await axios.get(`${server}/api/course/all`);
      setCourses(data.courses);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchCourse(id) {
    try {
      const { data } = await axios.get(`${server}/api/course/${id}`);
      setCourse(data.course);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchMyCourse() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found for fetching enrolled courses");
        return;
      }

      const { data } = await axios.get(`${server}/api/mycourse`, {
        headers: {
          token: token,
        },
      });

      console.log("Fetched enrolled courses:", data.courses.length);
      setMyCourse(data.courses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      if (error.response?.status === 401) {
        console.log("Token expired or invalid");
      }
    }
  }

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
    if (course._id === courseId) {
      setCourse(prevCourse => ({
        ...prevCourse,
        averageRating: newRating,
        numberOfRatings
      }));
    }

    // Force a refresh of all course data
    setLastUpdate(Date.now());
  };

  // Refresh all course data
  const refreshCourseData = async () => {
    await Promise.all([
      fetchCourses(),
      fetchMyCourse(),
      course._id && fetchCourse(course._id)
    ]);
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    fetchCourses();
    fetchMyCourse();
  }, []);

  return (
    <CourseContext.Provider
      value={{
        courses,
        fetchCourses,
        fetchCourse,
        course,
        mycourse,
        fetchMyCourse,
        updateCourseRating,
        refreshCourseData,
        lastUpdate
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);
