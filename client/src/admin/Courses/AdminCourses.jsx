import React, { useState, useEffect } from "react";
import Layout from "../Utils/Layout";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";
import { FaBook, FaPlus, FaBookOpen } from "react-icons/fa";

const AdminCourses = ({ user }) => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (user && user.role !== "admin") return navigate("/");

  const { courses } = CourseData();

  useEffect(() => {
    if (courses) {
      setIsLoading(false);
    }
  }, [courses]);

  return (
    <Layout>
      <div className="admin-courses-page">
        <div className="admin-courses-container">
          <div className="section-header">
            <div className="header-content">
              <h1 className="section-title">Course Management</h1>
              <p className="section-subtitle">Create and manage your educational content</p>
              <button 
                className="common-btn"
                onClick={() => navigate("/admin/course/add")}
              >
                <FaPlus className="icon" /> New Course
              </button>
            </div>
          </div>

          <div className="courses-section">
            <div className="container">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaBook />
                  </div>
                  <div className="stat-details">
                    <h3 className="stat-value">{courses?.length || 0}</h3>
                    <p className="stat-label">Total Courses</p>
                  </div>
                </div>
              </div>

              <div className="courses-container">
                {isLoading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading courses...</p>
                  </div>
                ) : courses && courses.length > 0 ? (
                  <div className="courses-grid">
                    {courses.map((course) => (
                      <div className="course-card" key={course._id}>
                        <CourseCard course={course} compact={true} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FaBookOpen />
                    </div>
                    <h3>Start Your Teaching Journey</h3>
                    <p>Create your first course and begin sharing knowledge</p>
                    <button 
                      className="common-btn"
                      onClick={() => navigate("/admin/course/add")}
                    >
                      Create Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .admin-courses-page {
            display: flex;
            min-height: 100vh;
            background: var(--background-light);
          }

          .admin-courses-container {
            position: relative;
            width: 110%;
            margin-left: auto;
            margin-right: 0.5rem;
            padding-left: 1.5rem;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            padding-bottom: var(--spacing-xl);
          }

          .section-header {
            background: var(--primary-color);
            padding: var(--spacing-xl) 0;
            text-align: center;
            color: var(--text-light);
            height: 40%;
            width: 100%;
          }

          .header-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 var(--spacing-md);
          }

          .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: var(--spacing-sm);
            color: var(--text-light);
          }

          .section-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: var(--spacing-lg);
          }

          .courses-section {
            padding: var(--spacing-xl) 0;
            flex: 1;
          }

          .container {
            max-width: 1500px;
            margin: 0 auto;
            padding: 0 var(--spacing-sm);
          }

          .stats-row {
            margin-bottom: var(--spacing-xl);
          }

          .stat-card {
            background: var(--background-white);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-lg);
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            box-shadow: var(--shadow-sm);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            background: var(--primary-color);
            color: white;
            border-radius: var(--border-radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
          }

          .stat-details {
            flex: 1;
          }

          .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 0;
          }

          .stat-label {
            color: var(--text-secondary);
            margin: 0;
            font-size: 0.9rem;
          }

          .courses-container {
            background: var(--background-white);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
          }

          .courses-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--spacing-lg);
          }

          .course-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
          }

          .course-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
          }

          @media (max-width: 1200px) {
            .courses-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .admin-courses-container {
              width: 100%;
              margin-left: 0;
              margin-right: 0;
              padding-left: 0;
            }

            .section-title {
              font-size: 2rem;
            }

            .section-subtitle {
              font-size: 1rem;
            }

            .courses-grid {
              grid-template-columns: 1fr;
            }

            .stat-card {
              padding: var(--spacing-md);
            }

            .stat-value {
              font-size: 1.5rem;
            }
          }

          .loading-state {
            text-align: center;
            padding: var(--spacing-xl) 0;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto var(--spacing-md);
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .empty-state {
            text-align: center;
            padding: var(--spacing-xl) 0;
          }

          .empty-icon {
            width: 80px;
            height: 80px;
            background: var(--primary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin: 0 auto var(--spacing-lg);
          }

          .empty-state h3 {
            font-size: 1.5rem;
            color: var(--text-primary);
            margin-bottom: var(--spacing-sm);
          }

          .empty-state p {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-lg);
            font-size: 1.1rem;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default AdminCourses;