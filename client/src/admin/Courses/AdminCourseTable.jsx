import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { server } from '../../config';
import toast from 'react-hot-toast';
import axios from 'axios';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './adminCourseTable.css';

const AdminCourseTable = ({ courses, onCoursesUpdate }) => {
  const navigate = useNavigate();
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleManage = (courseId) => {
    navigate(`/admin/lectures/${courseId}`);
  };

  const handleAssessment = (courseId) => {
    navigate(`/admin/course/${courseId}/assessment`);
  };

  const handleEdit = (courseId) => {
    navigate(`/admin/course/edit/${courseId}`);
  };

  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;
    
    setDeletingCourseId(selectedCourse._id);
    setShowConfirmDialog(false);

    try {
      const { data } = await axios.delete(`${server}/api/course/${selectedCourse._id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      toast.success(data.message);
      onCoursesUpdate(); // Refresh courses after deletion
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting course');
    } finally {
      setDeletingCourseId(null);
      setSelectedCourse(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmDialog(false);
    setSelectedCourse(null);
  };

  return (
    <>
      <div className="admin-course-table-container">
        <table className="admin-course-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Instructor</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id}>
                <td>{course.title}</td>
                <td>{course.createdBy}</td>
                <td>{course.duration} weeks</td>
                <td>${course.price}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleManage(course._id)}
                      className="manage-btn"
                    >
                      Manage Lectures
                    </button>
                    <button
                      onClick={() => handleAssessment(course._id)}
                      className="assessment-btn"
                    >
                      Manage Assessment
                    </button>
                    <button
                      onClick={() => handleEdit(course._id)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(course)}
                      className="delete-btn"
                      disabled={deletingCourseId === course._id}
                    >
                      {deletingCourseId === course._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Delete Course"
        message={`Are you sure you want to delete "${selectedCourse?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default AdminCourseTable; 