import React from "react";
import "./courseCard.css";
import { server } from "../../config";
import { UserData } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { user, isAuth } = UserData();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-course.jpg';
    
    const cleanPath = imagePath
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');
    
    return `${server}/uploads/${cleanPath}`;
  };

  const handleStudyClick = (courseId) => {
    if (!courseId) {
      console.error('No course ID provided for study:', course);
      toast.error('Unable to access course');
      return;
    }
    
    navigate(`/course/study/${courseId}`);
  };

  const handleGetStarted = (courseId) => {
    if (!courseId) {
      console.error('No course ID provided for get started:', course);
      toast.error('Unable to access course');
      return;
    }
    navigate(`/course/${courseId}/details`);
  };

  // Early return if no course or course ID
  if (!course || !course._id) {
    console.error('Invalid course object:', course);
    return null;
  }

  // Early return if user is admin
  if (user?.role === "admin") {
    return null;
  }

  const renderButtons = () => {
    if (!isAuth) {
      return (
        <button onClick={() => navigate("/login")} className="common-btn">
          Get Started
        </button>
      );
    }

    return user?.subscription?.includes(course._id) ? (
      <button
        onClick={() => handleStudyClick(course._id)}
        className="common-btn"
      >
        Study
      </button>
    ) : (
      <button
        onClick={() => handleGetStarted(course._id)}
        className="common-btn"
      >
        Get Started
      </button>
    );
  };

  return (
    <div className="course-card">
      <img 
        src={getImageUrl(course.image)} 
        alt={course.title || ''} 
        className="course-image"
        onError={(e) => {
          e.target.src = '/placeholder-course.jpg';
        }}
      />
      <h3>{course.title}</h3>
      <p>Ustaz - {course.createdBy}</p>
      <p>Duration- {course.duration} weeks</p>
      <p>Price- ${course.price}</p>
      {renderButtons()}
    </div>
  );
};

export default CourseCard;
