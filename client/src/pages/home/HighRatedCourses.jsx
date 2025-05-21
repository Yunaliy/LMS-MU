import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { server } from "../../config";
import CourseCard from "../../components/coursecard/CourseCard";
import "./highRatedCourses.css";

const HighRatedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopRatedCourses = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${server}/api/course/top-rated`);
        setCourses(data.courses || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch top-rated courses");
        console.error("Error fetching top-rated courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedCourses();
  }, []);

  if (loading) {
    return (
      <section className="featured-courses-section">
        <h2 className="section-title">Featured Courses</h2>
        <div className="loading-courses">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-courses-section">
        <h2 className="section-title">Featured Courses</h2>
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!courses.length) {
    return (
      <section className="featured-courses-section">
        <h2 className="section-title">Featured Courses</h2>
        <div className="no-courses">
          <p>Discover our featured courses</p>
          <button 
            className="explore-btn"
            onClick={() => navigate("/courses")}
          >
            Explore All Courses
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-courses-section">
      <h2 className="section-title">Featured Courses</h2>
      <div className="courses-grid">
        {courses.map((course) => (
          <CourseCard
            key={course._id}
            course={course}
            showRating={true}
            onClick={() => navigate(`/course/${course._id}/details`)}
          />
        ))}
      </div>
    </section>
  );
};

export default HighRatedCourses; 