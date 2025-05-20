import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { server } from '../../config';
import Layout from '../Utils/Layout';
import AdminCourseTable from './AdminCourseTable';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import './adminCourses.css';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validateToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchCourses = useCallback(async () => {
    try {
      if (!validateToken()) return;
      
      setLoading(true);
      setError(null);

      const { data } = await axios.get(`${server}/api/course/all`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      // Check if user is admin
      if (!data.meta?.isAdmin) {
        navigate('/'); // Redirect non-admin users to home
        toast.error('Access denied. Admin only.');
        return;
      }

      setCourses(data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        localStorage.removeItem("token"); // Clear invalid token
        navigate('/login');
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        navigate('/');
        toast.error('Access denied. Admin only.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (validateToken()) {
      fetchCourses();
    }
  }, [fetchCourses]);

  const handleCoursesUpdate = () => {
    fetchCourses();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-container">
          <h3>Error Loading Courses</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={fetchCourses}
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-courses-container">
        <div className="admin-courses-header">
          <h2>Manage Courses</h2>
          <button 
            className="add-course-btn"
            onClick={() => navigate('/admin/course/new')}
          >
            <FaPlus /> Add New Course
          </button>
        </div>

        <AdminCourseTable 
          courses={courses} 
          onCoursesUpdate={handleCoursesUpdate}
        />
      </div>
    </Layout>
  );
};

export default AdminCourses;