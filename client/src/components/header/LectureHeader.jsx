import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './lecture-header.css';

const LectureHeader = ({ courseTitle, progressElement }) => {
  const navigate = useNavigate();

  return (
    <header className="lecture-header">
      <div className="lecture-header-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h1 className="course-title">{courseTitle}</h1>
        {progressElement && (
          <div className="header-right">
            {progressElement}
          </div>
        )}
      </div>
    </header>
  );
};

export default LectureHeader; 