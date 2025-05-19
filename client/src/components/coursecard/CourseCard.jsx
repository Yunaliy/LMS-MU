import React, { useEffect, useState, useCallback } from "react";
import "./courseCard.css";
import { server } from "../../config";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import CourseCardSkeleton from "./CourseCardSkeleton";
import StarRating from '../StarRating/StarRating.jsx';
import RatingDialog from '../RatingDialog/RatingDialog.jsx';

const CourseCard = ({ course: propCourse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuth } = UserData();
  const { courses, mycourse, updateCourseRating, refreshCourseData, lastUpdate, fetchCourse } = CourseData();
  const isDashboard = location.pathname === '/dashboard';
  const isStudyPage = location.pathname.includes('/course/study/');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [localCourse, setLocalCourse] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Fetch fresh course data
  const fetchFreshCourseData = useCallback(async (courseId) => {
    if (!courseId) return;
    
    // Prevent fetching too frequently (at least 1 second between fetches)
    const now = Date.now();
    if (now - lastFetchTime < 1000) return;
    
    try {
      const { data } = await axios.get(`${server}/api/course/${courseId}`);
      if (data.course) {
        setLocalCourse(data.course);
        setLastFetchTime(now);
      }
    } catch (error) {
      console.error("Error fetching fresh course data:", error);
    }
  }, [lastFetchTime]);

  // Get the course from context if available, otherwise use the prop
  const course = React.useMemo(() => {
    if (!propCourse?._id) return null;
    
    // First try to use local course data if available
    if (localCourse?._id === propCourse._id) {
      return localCourse;
    }
    
    // Then try to find the course in the courses list
    const courseFromList = courses.find(c => c._id === propCourse._id);
    if (courseFromList) return courseFromList;
    
    // Try to find the course in mycourse list
    const courseFromMyCourses = mycourse.find(c => c._id === propCourse._id);
    if (courseFromMyCourses) return courseFromMyCourses;
    
    // Fallback to prop course
    return propCourse;
  }, [propCourse, courses, mycourse, localCourse]);

  // Effect to fetch fresh course data only when needed
  useEffect(() => {
    if (course?._id) {
      fetchFreshCourseData(course._id);
    }
  }, [course?._id, fetchFreshCourseData]);

  const averageCourseRating = course?.averageRating || 0;
  const numberOfCourseRatings = course?.numberOfRatings || 0;

  useEffect(() => {
    const fetchProgress = async () => {
      if (isDashboard && user?.subscription?.includes(course._id)) {
        try {
          const token = localStorage.getItem("token");
          const { data } = await axios.get(
            `${server}/api/user/progress?course=${course._id}`,
            {
              headers: { token }
            }
          );
          setProgress(data.courseProgressPercentage || 0);
        } catch (error) {
          console.error("Error fetching progress:", error);
        }
      }
    };

    const fetchUserRating = async () => {
      if (isDashboard && isAuth && user?.subscription?.includes(course._id)) {
        try {
          const token = localStorage.getItem("token");
          const { data } = await axios.get(
            `${server}/api/course/${course._id}/rating/my`,
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
      } else {
        setUserRating(null);
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await fetchProgress();
      await fetchUserRating();
      setIsLoading(false);
    };

    if (course?._id) {
      loadData();
    }
  }, [course?._id, isDashboard, isAuth, user?.subscription]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-course.jpg';
    
    const cleanPath = imagePath
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');
    
    return `${server}/uploads/${cleanPath}`;
  };

  const handleCardClick = () => {
    if (!course._id) {
      console.error('No course ID provided:', course);
      toast.error('Unable to access course');
      return;
    }
    
    if (!isAuth) {
      navigate("/login");
      return;
    }

    if (isDashboard && user?.subscription?.includes(course._id)) {
      navigate(`/course/study/${course._id}`);
    } else {
      navigate(`/course/${course._id}/details`);
    }
  };

  const handleStarClick = (event) => {
    event.stopPropagation(); 
    if (isDashboard && isAuth && user?.subscription?.includes(course._id)) {
       setShowRatingDialog(true);
    } else if (!isAuth) {
       toast.error("Please login to rate this course");
       navigate("/login");
    } else if (!user?.subscription?.includes(course._id)) {
       toast.error("Please purchase this course to rate it");
    }
  };

   const handleSaveRating = async (ratingValue) => {
     try {
       const token = localStorage.getItem("token");
       const { data } = await axios.post(
         `${server}/api/course/${course._id}/rating`,
         { rating: ratingValue },
         { headers: { token } }
       );
       setUserRating(ratingValue);
       
       // Update context with new rating
       updateCourseRating(course._id, data.averageRating, data.numberOfRatings);
       
       // Fetch fresh course data
       await fetchFreshCourseData(course._id);
       
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
         `${server}/api/course/${course._id}/rating/my`,
         { headers: { token } }
       );
       setUserRating(null);
       
       // Update context with new rating
       updateCourseRating(course._id, data.averageRating, data.numberOfRatings);
       
       // Fetch fresh course data
       await fetchFreshCourseData(course._id);
       
       toast.success("Rating deleted successfully");
     } catch (error) {
       console.error("Error deleting rating:", error);
       toast.error(error.response?.data?.message || "Failed to delete rating");
     }
   };

  if (!course || !course._id) {
    console.error('Invalid course object:', course);
    return null;
  }

  if (user?.role === "admin") {
    return null;
  }

  if (isLoading) {
    return <CourseCardSkeleton />;
  }

  const isEnrolled = user?.subscription?.includes(course._id);
  const isCoursesPage = location.pathname === '/courses';

  return (
    <div 
      className={`course-card ${isDashboard ? "dashboard-card" : ""} ${isStudyPage ? 'study-page' : ''} ${!isDashboard ? 'clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="image-container">
      <img 
        src={getImageUrl(course.image)} 
        alt={course.title || ''} 
        className="course-image"
        onError={(e) => {
          e.target.src = '/placeholder-course.jpg';
        }}
      />
      </div>
      <div className="course-info">
      <h3>{course.title}</h3>
        <p className="instructor">Ustaz - {course.createdBy}</p>
        <p className="duration">Duration - {course.duration} weeks</p>
        {!isDashboard && <p className="price">Price - ${course.price}</p>}
        {isDashboard && isEnrolled && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}% Complete</span>
          </div>
        )}

        {(isCoursesPage || (isDashboard && isEnrolled)) && (
             <div className="rating-section" onClick={handleStarClick}> 
                 {isCoursesPage && (
                      <span className="average-rating-display">
                          <StarRating rating={averageCourseRating} size={16} color="var(--primary-color)" interactive={false} average={true} />
                           {numberOfCourseRatings > 0 && (
                              <span className="rating-count">{averageCourseRating.toFixed(1)} ({numberOfCourseRatings} ratings)</span>
                           )}
                      </span>
                 )}
                 
                 {(isDashboard && isEnrolled) && (
                     <span className="user-rating-display">
                         <StarRating 
                             rating={userRating}
                             onRatingClick={() => setShowRatingDialog(true)}
                             size={16}
                             color="var(--primary-color)"
                             interactive={true}
                         />
                         <span className="rating-text">
                             {userRating !== null ? userRating.toFixed(1) : "Leave Rating"}
                         </span>
                     </span>
                 )}
             </div>
         )}

      </div>

      {isDashboard && isEnrolled && (
          <div onClick={(e) => e.stopPropagation()}>
          <RatingDialog 
              isOpen={showRatingDialog}
              onClose={() => setShowRatingDialog(false)}
              currentRating={userRating}
              onSave={handleSaveRating}
              onDelete={handleDeleteRating}
              courseTitle={course?.title}
          />
          </div>
      )}

    </div>
  );
};

export default CourseCard;


