import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { server } from '../../config';
import toast from 'react-hot-toast';
import axios from 'axios';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { FaEdit, FaBook, FaClipboardList, FaTrash, FaGlobe, FaGlobeAmericas } from 'react-icons/fa';
import { useCourses } from '../../context/CourseContext';
import './adminCourseTable.css';

const AdminCourseTable = ({ courses, onCoursesUpdate }) => {
  const navigate = useNavigate();
  const { updateCourseStatus } = useCourses();
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [publishingCourseId, setPublishingCourseId] = useState(null);

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

  const handlePublishToggle = async (course) => {
    try {
      setPublishingCourseId(course._id);
      const success = await updateCourseStatus(course._id, !course.published);
      
      if (success) {
        onCoursesUpdate(); // Refresh admin course list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating course status');
    } finally {
      setPublishingCourseId(null);
    }
  };

  const getPublishButtonProps = (course) => {
    const isPublishing = publishingCourseId === course._id;
    const hasLectures = Array.isArray(course.lectures) && course.lectures.length > 0;
    const hasAssessment = course.assessment !== null && course.assessment !== undefined;
    const canPublish = hasLectures && hasAssessment;

    let tooltipMessage = "";
    if (!canPublish) {
      if (!hasLectures) tooltipMessage += "Add at least one lecture. ";
      if (!hasAssessment) tooltipMessage += "Create an assessment.";
    }

    return {
      disabled: isPublishing || (!course.published && !canPublish),
      title: tooltipMessage || "",
      className: `publish-btn ${course.published ? 'published' : ''} ${!canPublish ? 'disabled' : ''}`,
      onClick: () => handlePublishToggle(course)
    };
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
              <th>Status</th>
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
                  <button {...getPublishButtonProps(course)}>
                    {course.published ? (
                      <><FaGlobeAmericas /> Published</>
                    ) : (
                      <><FaGlobe /> Unpublished</>
                    )}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(course._id)}
                      className="edit-btn"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleManage(course._id)}
                      className="manage-btn"
                    >
                      <FaBook /> Lectures
                    </button>
                    <button
                      onClick={() => handleAssessment(course._id)}
                      className="assessment-btn"
                    >
                      <FaClipboardList /> Assessment
                    </button>
                    <button
                      onClick={() => handleDeleteClick(course)}
                      className="delete-btn"
                      disabled={deletingCourseId === course._id}
                    >
                      <FaTrash /> {deletingCourseId === course._id ? 'Deleting...' : 'Delete'}
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