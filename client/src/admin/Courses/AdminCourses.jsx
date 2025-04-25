import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Utils/Layout';
import { CourseData } from '../../context/CourseContext';
import AdminCourseTable from './AdminCourseTable';
import Loading from '../../components/Loading';
import { FaPlus } from 'react-icons/fa';
import './adminCourses.css';

const AdminCourses = () => {
  const { courses, loading, fetchCourses } = CourseData();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="admin-courses-container">
        <div className="admin-courses-header">
          <div className="header-content">
            <h2>Course Management</h2>
            <Link to="/admin/course/new" className="add-course-btn">
              <FaPlus /> Add New Course
            </Link>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <AdminCourseTable 
            courses={filteredCourses} 
            onCoursesUpdate={fetchCourses}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminCourses;