import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseData } from '../../context/CourseContext';
import { UserData } from '../../context/UserContext';
import { server } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaLock, FaPlay, FaClock, FaBook, FaUsers, FaInfinity, FaTimes } from 'react-icons/fa';
import './courseDetailedDescription.css';
import Loading from '../../components/Loading';
import StarRating from '../../components/StarRating/StarRating.jsx';
import RatingDialog from '../../components/RatingDialog/RatingDialog.jsx';

const VideoPreviewDialog = ({ lecture, onClose }) => {
  if (!lecture) return null;

  let videoUrl = '';
  if (lecture.videoSource === 'youtube' && lecture.youtubeVideoId) {
    videoUrl = `https://www.youtube.com/embed/${lecture.youtubeVideoId}`;
  } else if (lecture.videoSource === 'local' && lecture.file) {
    videoUrl = lecture.file.startsWith('uploads/') ? `${server}/${lecture.file}` : `${server}/uploads/${lecture.file}`;
  }

  return (
    <div className="video-preview-overlay">
      <div className="video-preview-content">
        <div className="video-preview-header">
          <h3>{lecture.title}</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="video-container">
          {lecture.videoSource === 'youtube' ? (
            <iframe
              className="preview-video"
              src={videoUrl}
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="preview-video"
              src={videoUrl}
              controls
              controlsList="nodownload"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const CourseDetailedDescription = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const { fetchUser } = UserData();
  const { fetchCourse, course } = CourseData();
  const { user, isAuth } = UserData();

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id);
      fetchLectures();
    }
  }, [params.id]);

  const fetchLectures = async () => {
    try {
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: {
          "token": localStorage.getItem("token")
        }
      });
      setLectures(data.lectures);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast.error('Failed to load lectures');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-course.jpg';
    
    const cleanPath = imagePath
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');
    
    return `${server}/uploads/${cleanPath}`;
  };

  const handlePreviewClick = async (lecture) => {
    try {
      const response = await axios.get(`${server}/api/lecture/${lecture._id}`, {
        headers: { token: localStorage.getItem('token') }
      });
      
      if (response.data.lecture) {
        const videoUrl = response.data.lecture.videoSource === 'youtube' 
          ? `https://www.youtube.com/embed/${response.data.lecture.youtubeVideoId}`
          : `${server}/uploads/${response.data.lecture.file}`;
        
        setSelectedLecture({
          ...response.data.lecture,
          video: videoUrl
        });
        setIsVideoDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching lecture:', error);
      toast.error('Failed to load preview');
    }
  };

  const handleWatchClick = async (lecture) => {
    try {
      const response = await axios.get(`${server}/api/lecture/${lecture._id}`, {
        headers: { token: localStorage.getItem('token') }
      });
      
      if (response.data.lecture) {
        setSelectedLecture(response.data.lecture);
        setIsVideoDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching lecture:', error);
      toast.error('Failed to load video');
    }
  };

  const checkoutHandler = async () => {
    if (!isAuth) {
      toast.error("Please login to purchase this course");
      navigate('/login');
      return;
    }

    if (!user || !course) {
      toast.error("Please wait while we load the course details");
      return;
    }

    setLoading(true);
  
    try {
      const tx_ref = `course-${params.id}-${Date.now()}`;
      const currentOrigin = window.location.origin;
      const return_url = `${currentOrigin}/payment-success`;
      
      const { data } = await axios.post(
        `${server}/api/payment/initialize`,        
        {          
          amount: course.price,
          email: user.email,
          courseId: params.id,
          userId: user._id,
          courseTitle: course.title,
          return_url,
          tx_ref
        },
        { 
          headers: { 
            "token": localStorage.getItem("token"),
            "Content-Type": "application/json"
          } 
        }
      );
  
      if (data.success && data.checkoutUrl) {
        sessionStorage.setItem('lastPurchasedCourseId', params.id);
        sessionStorage.setItem('payment_return_url', return_url);
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
  
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  if (!course) {
    return <Loading />;
  }

  const renderLectureList = () => {
    return lectures.map((lecture, index) => (
      <div key={lecture._id} className="lecture-item">
        <div className="lecture-info">
          <span className="lecture-number">{index + 1}</span>
          <div className="lecture-title">{lecture.title}</div>
          {lecture.isPreview ? (
            <button
              className="preview-button"
              onClick={() => handlePreviewClick(lecture)}
              title="Click to preview this lecture"
            >
              <FaPlay /> Preview
            </button>
          ) : (
            <div 
              className="locked-lecture" 
              title="Currently no access to the lecture; please purchase to gain access"
            >
              <FaLock /> Locked
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="course-detailed-description">
      <div className="course-content">
        <div className="course-main-content">
          <div className="course-header">
            <h1>{course.title}</h1>
            <p className="course-subtitle">{course.subtitle}</p>
            <div className="course-meta">
              <span><FaUsers /> Created by {course.createdBy}</span>
              <span><FaClock /> {course.duration} weeks</span>
              <span><FaBook /> {lectures.length} lectures</span>
              <span><FaInfinity /> Full lifetime access</span>
              {(course.averageRating !== undefined && course.averageRating !== null) && (
                <span className="average-rating-display">
                  <StarRating 
                    rating={course.averageRating}
                    size={18}
                    color="var(--primary-color)"
                    interactive={false}
                    average={true}
                  />
                  <span className="rating-value">{course.averageRating.toFixed(1)}</span>
                  <span className="rating-count">({course.numberOfRatings} ratings)</span>
                </span>
              )}
            </div>
          </div>

          <div className="course-description-section">
            <h2>Course Description</h2>
            <div 
              className="course-description-content"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </div>

          <div className="course-curriculum">
            <h2>Course Content</h2>
            <div className="lecture-list">
              {renderLectureList()}
            </div>
          </div>
        </div>

        <div className="course-sidebar">
          <div className="course-card">
            <img 
              src={getImageUrl(course.image)} 
              alt={course.title}
              className="course-thumbnail"
              onError={(e) => {
                e.target.src = '/placeholder-course.jpg';
              }}
            />
            <div className="course-card-content">
              <div className="course-price">ETB {course.price}</div>
              {user && user.subscription && user.subscription.includes(course._id) ? (
                <button
                  onClick={() => navigate(`/course/study/${course._id}`)}
                  className="primary-button"
                >
                  View Course
                </button>
              ) : (
                <button 
                  onClick={checkoutHandler} 
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Enroll Now"}
                </button>
              )}
              <div className="course-includes">
                <h3>This course includes:</h3>
                <ul>
                  <li><FaPlay /> {lectures.length} lectures</li>
                  <li><FaClock /> {course.duration} weeks of content</li>
                  <li><FaInfinity /> Full lifetime access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VideoPreviewDialog
        lecture={selectedLecture}
        onClose={() => {
          setIsVideoDialogOpen(false);
          setSelectedLecture(null);
        }}
      />
    </div>
  );
};

export default CourseDetailedDescription;