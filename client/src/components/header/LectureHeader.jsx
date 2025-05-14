import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaGraduationCap } from 'react-icons/fa';
import './lecture-header.css';

const calculateCircleProgress = (percent) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  return {
    circumference,
    offset,
  };
};

const LectureHeader = ({ title, progressPercentage }) => {
  const navigate = useNavigate();
  const [showProgress, setShowProgress] = useState(false);
  const { circumference, offset } = calculateCircleProgress(progressPercentage);

  return (
    <header className="lecture-header">
      <div className="lecture-header-content">
        <div className="header-left">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
          <h1 className="course-title">{title}</h1>
        </div>
          <div className="header-right">
          <button 
            className="progress-button"
            onClick={() => setShowProgress(!showProgress)}
            title="Course Progress"
          >
            <FaGraduationCap />
          </button>
          {showProgress && (
            <div className="progress-tooltip">
              <div className="progress-circle">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle
                    className="progress-circle-bg"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="8"
                  />
                  <circle
                    className="progress-circle-fill"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--primary-color)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="progress-percentage">{progressPercentage}%</div>
              </div>
              <div className="progress-message">
                Complete the whole lecture to get the certificate
              </div>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

export default LectureHeader; 