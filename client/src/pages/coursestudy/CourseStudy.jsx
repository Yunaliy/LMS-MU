import React, { useEffect, useState, useCallback } from 'react';
import './courseStudy.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CourseData } from '../../context/CourseContext';
import { UserData } from '../../context/UserContext';
import { server } from '../../config';
import axios from 'axios';
import Layout from '../../admin/Utils/Layout';
import Loading from '../../components/Loading';
import { toast } from 'react-hot-toast';
import {
  FaLock,
  FaPlay,
  FaTasks,
  FaCertificate,
  FaCheck,
  FaClipboardCheck,
  FaDownload,
  FaTimes,
  FaBook
} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import StarRating from '../../components/StarRating/StarRating.jsx';
import RatingDialog from '../../components/RatingDialog/RatingDialog.jsx';

const CertificateModal = ({ isOpen, onClose, certificateUrl, onDownload, courseTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="certificate-modal-overlay">
      <div className="certificate-modal">
        <div className="certificate-modal-header">
          <h2>Course Certificate - {courseTitle}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="certificate-modal-content">
          <iframe
            src={certificateUrl}
            title="Certificate Preview"
            width="100%"
            height="600px"
            className="certificate-preview"
          />
        </div>
        <div className="certificate-modal-footer">
          <button className="download-btn" onClick={onDownload}>
            <FaDownload /> Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseStudy = () => {
  const { id, courseId } = useParams();
  const effectiveCourseId = id || courseId;
  const navigate = useNavigate();
  const { user } = UserData();
  const { fetchCourse } = CourseData();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [assessmentStatus, setAssessmentStatus] = useState({
    isPassed: false,
    hasAttempted: false,
  });
  const [lastProgressCheck, setLastProgressCheck] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [isLoadingCertificate, setIsLoadingCertificate] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  useEffect(() => {
    if (!effectiveCourseId) {
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      try {
        const { data } = await axios.get(
          `${server}/api/course/${effectiveCourseId}`,
          {
            headers: {
              token: localStorage.getItem('token'),
            },
          }
        );

        if (!data.course) {
          throw new Error('Course not found');
        }

        setCourse(data.course);
        setTotalLectures(data.course.lectures?.length || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.response?.data?.message || 'Error loading course');
        if (err.response?.status === 404) {
          navigate('/courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [effectiveCourseId, navigate]);

  useEffect(() => {
    console.log('Course ID:', effectiveCourseId); // Debugging
    console.log('Course Object:', course); // Debugging
  }, [effectiveCourseId, course]);

  const fetchProgress = useCallback(async () => {
    if (!effectiveCourseId || !user || user.role === "admin") return;

    try {
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${effectiveCourseId}`,
        {
          headers: {
            token: localStorage.getItem('token'),
          },
        }
      );

      if (data.message === "null" || !data.progress || !data.progress[0]) {
        setCompletedCount(0);
        setProgressPercentage(0);
        return;
      }

      const completedLecturesList = data.progress[0].completedLectures || [];
      const completedCount = completedLecturesList.length;
      setCompletedCount(completedCount);

      // Calculate percentage based on total lectures
      if (totalLectures > 0) {
        const percentage = Math.min(Math.round((completedCount / totalLectures) * 100), 100);
        setProgressPercentage(percentage);
      }

    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error("Failed to load progress");
      setCompletedCount(0);
      setProgressPercentage(0);
    }
  }, [effectiveCourseId, user, totalLectures]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      fetchProgress();
      const interval = setInterval(fetchProgress, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchProgress, user]);

  useEffect(() => {
    const fetchAssessmentStatus = async () => {
      if (!effectiveCourseId || !course || user?.role === "admin") return;

      try {
        const { data } = await axios.get(
          `${server}/api/assessment/status/${effectiveCourseId}`,
          {
            headers: {
              token: localStorage.getItem('token'),
            },
          }
        );

        console.log('Assessment status:', data); // Debug log

        setAssessmentStatus({
          isPassed: data.isPassed === true, // Explicitly check for true
          hasAttempted: true // If we got a response, it means there was an attempt
        });
      } catch (error) {
        if (error.response?.status === 404) {
          // No assessment attempt found
          setAssessmentStatus({
            isPassed: false,
            hasAttempted: false
          });
        } else {
          console.error('Error fetching assessment status:', error);
          toast.error('Failed to check assessment status');
        }
      }
    };

    fetchAssessmentStatus();
  }, [course, effectiveCourseId, user?.role]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (user?.subscription?.includes(effectiveCourseId)) {
        try {
          const token = localStorage.getItem("token");
          const { data } = await axios.get(
            `${server}/api/course/${effectiveCourseId}/rating/my`,
            { headers: { token } }
          );
          setUserRating(data.rating);
        } catch (error) {
          if (error.response?.status === 404) {
            setUserRating(null);
          } else {
            console.error("Error fetching user rating:", error);
          }
        }
      }
    };

    if (effectiveCourseId && user && user.role !== "admin") {
      fetchUserRating();
    }
  }, [effectiveCourseId, user]);

  const getImageUrl = imagePath => {
    if (!imagePath) return '/placeholder-course.jpg';

    // If it's a logo path, return as is since it's in the public directory
    if (imagePath.includes('logo')) {
      return imagePath;
    }

    // For course images, handle the uploads path
    const cleanPath = imagePath
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');

    return `${server}/uploads/${cleanPath}`;
  };

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });
    }, 250);
  };

  const handleViewCertificate = async () => {
    try {
      setIsLoadingCertificate(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view your certificate');
        return;
      }

      const response = await axios.get(`${server}/api/certificate/${effectiveCourseId}`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'token': token // Changed from Authorization to token
        },
      });

      // Check if we received a valid PDF
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Invalid content type:', contentType);
        throw new Error('Invalid certificate format received');
      }

      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setCertificateUrl(blobUrl);
      setShowCertificateModal(true);
    } catch (error) {
      console.error('Error viewing certificate:', error);
      if (error.response?.status === 403) {
        toast.error('You are not authorized to view this certificate. Please ensure you have completed the course and passed the assessment.');
      } else if (error.response?.status === 404) {
        toast.error('Certificate not found. Please complete the course and assessment first.');
    } else {
        toast.error(error.response?.data?.message || 'Failed to load certificate. Please try again.');
      }
    } finally {
      setIsLoadingCertificate(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to download your certificate');
        return;
      }

      const response = await axios.get(`${server}/api/certificate/${effectiveCourseId}`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'token': token // Changed from Authorization to token
        },
      });

      // Check if we received a valid PDF
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Invalid content type:', contentType);
        throw new Error('Invalid certificate format received');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${course?.title || 'course'}_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      if (error.response?.status === 403) {
        toast.error('You are not authorized to download this certificate. Please ensure you have completed the course and passed the assessment.');
      } else if (error.response?.status === 404) {
        toast.error('Certificate not found. Please complete the course and assessment first.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to download certificate. Please try again.');
      }
    }
  };

  const closeCertificateModal = useCallback(() => {
    setShowCertificateModal(false);
    if (certificateUrl) {
      URL.revokeObjectURL(certificateUrl);
      setCertificateUrl(null);
    }
  }, [certificateUrl]);

  useEffect(() => {
    return () => {
      if (certificateUrl) {
        URL.revokeObjectURL(certificateUrl);
      }
    };
  }, [certificateUrl]);

  const handleSaveRating = async (ratingValue) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${server}/api/course/${effectiveCourseId}/rating`,
        { rating: ratingValue },
        { headers: { token } }
      );
      setUserRating(ratingValue);
      toast.success("Rating saved successfully");
      setShowRatingDialog(false);
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error(error.response?.data?.message || "Failed to save rating");
    }
  };

  const handleDeleteRating = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(
        `${server}/api/course/${effectiveCourseId}/rating/my`,
        { headers: { token } }
      );
      setUserRating(null);
      toast.success("Rating deleted successfully");
      setShowRatingDialog(false);
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error(error.response?.data?.message || "Failed to delete rating");
    }
  };

  const handleContinueLearning = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${effectiveCourseId}`,
        {
          headers: { token }
        }
      );

      let targetLectureId;
      let timestamp = 0;

      if (data.progress && data.progress[0]?.lastWatchedLecture) {
        // If there's a last watched lecture, use that
        targetLectureId = data.progress[0].lastWatchedLecture.lectureId;
        timestamp = data.progress[0].lastWatchedLecture.timestamp || 0;
      } else if (course?.lectures && course.lectures.length > 0) {
        // Otherwise, use the first lecture
        targetLectureId = course.lectures[0]._id;
      }

      if (targetLectureId) {
        navigate(`/lectures/${effectiveCourseId}?lectureId=${targetLectureId}&timestamp=${timestamp}`);
      } else {
        toast.error('No lectures available in this course');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load course progress');
    }
  };

  const handleDownloadMaterial = async () => {
    if (!course?.material) {
      toast.error('No course material available');
      return;
    }

    try {
      const response = await axios.get(
        `${server}/uploads/${course.material}`,
        {
          responseType: 'blob',
          headers: {
            token: localStorage.getItem('token')
          }
        }
      );

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `${course.title}_material.pdf`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      toast.success('Material downloaded successfully');
    } catch (error) {
      console.error('Error downloading material:', error);
      toast.error('Failed to download material');
    }
  };

  const AdminView = () => (
    <div className="admin-course-management">
      <h1>Course Management</h1>
      <div className="admin-actions">
        <Link to={`/admin/lectures/${course?._id}`} className="admin-btn">
          <i className="fas fa-book"></i>
          <span>Manage Lectures</span>
          <small>{course?.lectures?.length || 0} lectures</small>
        </Link>
        <Link
          to={`/admin/course/${course?._id}/assessment`}
          className="admin-btn"
        >
          <i className="fas fa-tasks"></i>
          <span>Manage Assessment</span>
        </Link>
      </div>
    </div>
  );

  const UserView = () => {
    const isCompleted = completedCount === totalLectures && totalLectures > 0;
    const assessmentPassed = assessmentStatus.isPassed;
    const assessmentAttempted = assessmentStatus.hasAttempted;

    return (
      <div className="user-course-view">
        <div className="progress-info">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {Math.round(progressPercentage)}% Complete
            {isCompleted && <FaCheck className="check-icon" />}
          </span>
          <p className="progress-detail">
            {completedCount} of {totalLectures} lectures completed
          </p>
        </div>

        {/* Rating Section */}
        {user?.subscription?.includes(effectiveCourseId) && (
          <div className="rating-section" onClick={(e) => e.stopPropagation()}> 
            <StarRating 
              rating={userRating}
              onRatingClick={() => setShowRatingDialog(true)}
              size={20}
              color="var(--primary-color)"
              interactive={true}
            />
            <span className="rating-text">
              {userRating !== null ? userRating.toFixed(1) : "Leave Rating"}
            </span>
          </div>
        )}

        <div className="course-actions">
          <button
            onClick={handleContinueLearning}
            className={`action-btn ${isCompleted ? 'completed' : ''}`}
          >
            <FaPlay className="icon" />
            <span>Continue Learning</span>
          </button>

          {course?.material && (
            <button
              className="action-btn material-btn"
              onClick={handleDownloadMaterial}
              title="Download Course Material"
            >
              <FaDownload className="icon" />
              <span>Material</span>
            </button>
          )}

          <button
            className={`action-btn ${!isCompleted ? 'disabled' : ''}`}
            onClick={() =>
              isCompleted ? navigate(`/course/${course?._id}/assessment`) : null
            }
            title={!isCompleted ? 'Please complete all lectures first' : ''}
            disabled={!isCompleted}
          >
            {!isCompleted && <FaLock className="lock-icon" />}
            <FaTasks className="icon" />
            <span>Take Assessment</span>
          </button>

          <button
            className={`action-btn ${!assessmentPassed ? 'disabled' : 'enabled'}`}
            onClick={handleViewCertificate}
            disabled={!assessmentPassed}
            title={
              assessmentPassed
                ? "View your certificate"
                : assessmentAttempted
                ? "Complete the assessment to get your certificate"
                : "Attempt the assessment first"
            }
          >
            {!assessmentPassed && <FaLock className="lock-icon" />}
            <FaCertificate className="icon" />
            <span>Get Certificate</span>
          </button>
        </div>

        {/* Rating Dialog */}
        {user?.subscription?.includes(effectiveCourseId) && (
          <RatingDialog 
            isOpen={showRatingDialog}
            onClose={() => setShowRatingDialog(false)}
            currentRating={userRating}
            onSave={handleSaveRating}
            onDelete={handleDeleteRating}
            courseTitle={course?.title}
          />
        )}
      </div>
    );
  };

  if (loading) return <Loading />;
  if (error) return <div className="error-message">{error}</div>;
  if (!course) return <div className="error-message">Course not found</div>;

  const content = (
    <div className={`course-study-page ${user?.role === "admin" ? 'admin-mode' : ''}`}>
      <div className="course-header">
        <div className="image-container">
        <img
          src={getImageUrl(course.image)}
          alt={course.title || 'Course'}
          className="course-image"
          onError={e => {
            e.target.src = '/placeholder-course.jpg';
          }}
        />
        </div>
        <div className="course-info">
          <h2>{course.title}</h2>
          <div 
            className={`description ${isDescriptionExpanded ? 'expanded' : ''}`}
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
          {!isDescriptionExpanded && (
            <button 
              onClick={() => setIsDescriptionExpanded(true)}
              className="read-more-btn"
            >
              Read More
            </button>
          )}
          {isDescriptionExpanded && (
             <button
               onClick={() => setIsDescriptionExpanded(false)}
               className="read-more-btn"
             >
               Read Less
             </button>
           )}
          <div className="meta-info">
            <span>
              <i className="fas fa-user"></i> {course.createdBy}
            </span>
            <span>
              <i className="fas fa-clock"></i> {course.duration} weeks
            </span>
            <span>
              <i className="fas fa-book"></i> {course.lectures?.length || 0}{' '}
              lectures
            </span>
          </div>
        </div>
      </div>
      {user?.role === "admin" ? <AdminView /> : <UserView />}
    </div>
  );

  return (
    <>
            {user?.role === "admin" ? (
        <Layout>
          <div style={{ marginTop: '60px' }}>{content}</div>
        </Layout>
            ) : (
              <>
          {content}
          {showCertificateModal && (
            <div className="certificate-modal-overlay">
            <div className="certificate-modal">
                <div className="certificate-modal-header">
                  <h2 className="certificate-modal-title">Course Certificate - {course?.title}</h2>
                  <button className="certificate-modal-close" onClick={closeCertificateModal}>×</button>
                </div>
                <div className="certificate-viewer">
                  {certificateUrl && (
                    <iframe
                      src={certificateUrl}
                      title="Certificate Preview"
                      width="100%"
                      height="600px"
                      className="certificate-preview"
                    />
                  )}
                </div>
                <div className="certificate-actions">
                  <button
                    className="certificate-download-btn"
                    onClick={handleDownloadCertificate}
                    disabled={!certificateUrl || isLoadingCertificate}
                  >
                    <FaDownload /> Download Certificate
                  </button>
                </div>
          </div>
        </div>
          )}
        </>
      )}
    </>
  );
};

export default CourseStudy;
