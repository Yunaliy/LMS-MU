import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { server } from '../../config';
import Layout from '../Utils/Layout';
import toast from 'react-hot-toast';
import { FaYoutube, FaFileUpload, FaEdit, FaTrash, FaLock, FaLockOpen, FaToggleOn, FaToggleOff, FaArrowLeft } from 'react-icons/fa';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import './AdminLectureManager.css';

const AdminLectureManager = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    videoSource: 'local',
    youtubeUrl: '',
    file: null,
    isPreview: false
  });

  useEffect(() => {
    if (!courseId) {
      toast.error("Course ID is missing");
      navigate("/admin/courses");
      return;
    }
    fetchCourseAndLectures();
  }, [courseId, navigate]);

  const fetchCourseAndLectures = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      console.log("Fetching lectures for course ID:", courseId);
      setLoading(true);
      
      // Get course details
      const courseResponse = await axios.get(`${server}/api/course/${courseId}`, {
        headers: { 
          token: token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!courseResponse.data.course) {
        throw new Error('Course not found');
      }
      
      setCourseTitle(courseResponse.data.course.title);

      // Get lectures using the updated endpoint
      const lecturesResponse = await axios.get(`${server}/api/lectures/${courseId}`, {
        headers: { 
          token: token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lectures response:', lecturesResponse.data);
      
      if (!lecturesResponse.data.success) {
        throw new Error(lecturesResponse.data.message || 'Failed to fetch lectures');
      }
      
      setLectures(lecturesResponse.data.lectures || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load course data");
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        navigate("/admin/courses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : 
              value
    }));
  };

  const validateYouTubeUrl = (input) => {
    // Handle full YouTube URLs
    const fullUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    // Handle just the video ID
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}/;
    
    return fullUrlRegex.test(input) || videoIdRegex.test(input);
  };

  const extractYouTubeId = (input) => {
    // Check if input is already just a video ID
    if (/^[a-zA-Z0-9_-]{11}/.test(input)) {
      return input.slice(0, 11); // Take just the first 11 characters (video ID length)
    }
    
    // Extract from full URL
    const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('videoSource', formData.videoSource);
      formDataToSend.append('isPreview', formData.isPreview);
      
      if (formData.videoSource === 'youtube') {
        const youtubeInput = formData.youtubeUrl.trim();
        if (!validateYouTubeUrl(youtubeInput)) {
          toast.error('Please enter a valid YouTube video ID or URL');
          return;
        }
        const youtubeId = extractYouTubeId(youtubeInput);
        if (!youtubeId) {
          toast.error('Could not extract YouTube video ID');
          return;
        }
        formDataToSend.append('youtubeVideoId', youtubeId);
      } else {
        if (!isEditing && !formData.file) {
          toast.error('Please select a file to upload');
          return;
        }
        if (formData.file) {
          formDataToSend.append('file', formData.file);
        }
      }

      if (isEditing && selectedLecture) {
        // Update existing lecture
        await axios.put(
          `${server}/api/lecture/${selectedLecture._id}`,
          formDataToSend,
          {
            headers: {
              token: localStorage.getItem('token'),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Lecture updated successfully');
      } else {
        // Add new lecture
        await axios.post(
          // `${server}/api/lecture/course/${courseId}/lecture`,
          `${server}/api/course/${courseId}/lecture`,
          formDataToSend,
          {
            headers: {
              token: localStorage.getItem('token'),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Lecture added successfully');
      }

      // Reset form and state
      setShowAddForm(false);
      setIsEditing(false);
      setSelectedLecture(null);
      setFormData({
        title: '',
        videoSource: 'local',
        youtubeUrl: '',
        file: null,
        isPreview: false
      });
      fetchCourseAndLectures();
    } catch (error) {
      console.error('Error saving lecture:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} lecture`);
    }
  };

  // Helper function to determine file type
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('powerpoint')) return 'ppt';
    if (mimeType.includes('word')) return 'doc';
    return 'video'; // default to video
  };

  const handleEditClick = (lecture) => {
    setIsEditing(true);
    setSelectedLecture(lecture);
    
    // Determine video source and URL
    let videoSource = 'local';
    let youtubeUrl = '';
    
    if (lecture.videoSource === 'youtube') {
      videoSource = 'youtube';
      youtubeUrl = lecture.youtubeVideoId || '';
    }
    
    setFormData({
      title: lecture.title || '',
      videoSource: videoSource,
      youtubeUrl: youtubeUrl,
      file: null,
      isPreview: lecture.isPreview || false
    });
    
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (lecture) => {
    setSelectedLecture(lecture);
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLecture) return;

    try {
      await axios.delete(`${server}/api/lecture/${selectedLecture._id}`, {
        headers: { token: localStorage.getItem('token') }
      });
      
      toast.success('Lecture deleted successfully');
      fetchCourseAndLectures();
    } catch (error) {
      console.error('Error deleting lecture:', error);
      toast.error('Failed to delete lecture');
    } finally {
      setShowConfirmDialog(false);
      setSelectedLecture(null);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setIsEditing(false);
    setSelectedLecture(null);
    setFormData({
      title: '',
      videoSource: 'local',
      youtubeUrl: '',
      file: null,
      isPreview: false
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-lecture-manager loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-lecture-manager">
        <div className="admin-lecture-header">
          <button 
            className="back-button1"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          
          <div className="header-content">
            <div className="course-title">
              Manage Lectures for {courseTitle} Course
            </div>
            <div className="lectures-count">
              Total Lectures: {lectures.length}
            </div>
          </div>
          
          {!showAddForm && (
            <button 
              className="add-lecture-btn"
              onClick={() => setShowAddForm(true)}
            >
              Add New Lecture
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="lecture-form-container">
            <form onSubmit={handleSubmit} className="lecture-form">
              <div className="form-group">
                <label htmlFor="title">Lecture Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter lecture title"
                />
              </div>

              <div className="form-group">
                <label>Content Type</label>
                <div className="video-source-selector">
                  <button
                    type="button"
                    className={`source-btn ${formData.videoSource === 'local' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, videoSource: 'local' }))}
                  >
                    <FaFileUpload /> Local File
                  </button>
                  <button
                    type="button"
                    className={`source-btn ${formData.videoSource === 'youtube' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, videoSource: 'youtube' }))}
                  >
                    <FaYoutube /> YouTube Video
                  </button>
                </div>
              </div>

              {formData.videoSource === 'youtube' ? (
                <div className="form-group">
                  <label htmlFor="youtubeUrl">YouTube Video URL *</label>
                  <input
                    type="text"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="file">
                    Upload File {!isEditing && '*'}
                  </label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    onChange={handleInputChange}
                    accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
                    required={!isEditing}
                  />
                  <small>Supported formats: Video, Audio, PDF, Word, PowerPoint</small>
                </div>
              )}

              <div className="checkbox-group">
                <span>Preview Available?</span>
                <button
                  type="button"
                  className={`preview-toggle ${formData.isPreview ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, isPreview: !prev.isPreview }))}
                  aria-label="Toggle preview availability"
                >
                  {formData.isPreview ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditing ? 'Update Lecture' : 'Add Lecture'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="lectures-list">
          {lectures.map((item, index) => (
            <div key={item._id} className="lecture-item">
              <div className="lecture-info">
                <span className="lecture-number">{index + 1}</span>
                <div className="lecture-details">
                  <h4>{item.title}</h4>
                  {item.isPreview && (
                    <span className="free-preview-badge">
                      <FaLockOpen /> Preview Available
                    </span>
                  )}
                </div>
              </div>
              <div className="lecture-actions">
                <button 
                  type="button"
                  className="edit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditClick(item);
                  }}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteClick(item)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <ConfirmationDialog
          isOpen={showConfirmDialog}
          title="Delete Lecture"
          message={`Are you sure you want to delete "${selectedLecture?.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowConfirmDialog(false);
            setSelectedLecture(null);
          }}
        />
      </div>
    </Layout>
  );
};

export default AdminLectureManager; 