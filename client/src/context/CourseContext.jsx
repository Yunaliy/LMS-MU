import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { server } from "../config";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState([]);
  const [mycourse, setMyCourse] = useState([]);

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
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);
