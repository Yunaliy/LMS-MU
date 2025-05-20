import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
        setError(null);
        const { data } = await axios.get("http://localhost:5000/api/course/top-rated", {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (data.success) {
          setCourses(data.courses);
        } else {
          setError(data.message || "Unable to load courses at this time");
        }
      } catch (error) {
        console.error("Error fetching top rated courses:", error);
        setError(
          error.response?.data?.message || 
          "Unable to load courses. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedCourses();
  }, []);

  if (loading) {
    return (
      <section className="high-rated-section">
        <h2 className="high-rated-title">Featured Courses</h2>
        <div className="loading-courses">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="high-rated-section">
        <h2 className="high-rated-title">Featured Courses</h2>
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
      <section className="high-rated-section">
        <h2 className="high-rated-title">Featured Courses</h2>
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
    <section className="high-rated-section">
      <h2 className="high-rated-title">High Rated Courses</h2>
      <div className="high-rated-courses-row">
        {courses.map((course) => (
          <div 
            className="course-card" 
            key={course._id}
            onClick={() => navigate(`/course/${course._id}`)}
          >
            <div className="course-image">
              <img 
                src={course.image?.url || "/assets/default-course.jpg"} 
                alt={course.title} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/assets/default-course.jpg";
                }}
              />
              {course.isBestseller && <span className="bestseller-badge">Bestseller</span>}
            </div>
            <div className="course-info">
              <h3 className="course-title">{course.title}</h3>
              <div className="course-instructor">{course.createdBy}</div>
              <div className="course-rating">
                <span className="rating-value">
                  {course.averageRating ? course.averageRating.toFixed(1) : "New"}
                </span>
                {course.averageRating > 0 && <span className="star">★</span>}
                {course.ratingCount > 0 && (
                  <span className="reviews">({course.ratingCount})</span>
                )}
              </div>
              <div className="course-price">
                <span className="current-price">ETB {course.price}</span>
                {course.oldPrice && <span className="old-price">ETB {course.oldPrice}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HighRatedCourses; 