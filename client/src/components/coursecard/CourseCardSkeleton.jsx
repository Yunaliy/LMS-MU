import React from 'react';
import './courseCard.css';

const CourseCardSkeleton = () => {
  return (
    <div className="course-card skeleton">
      <div className="image-container">
        <div className="course-image skeleton-image"></div>
      </div>
      <div className="course-info">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text"></div>
      </div>
    </div>
  );
};

export default CourseCardSkeleton; 