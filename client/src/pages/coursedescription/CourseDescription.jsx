import React, { useEffect, useState } from "react";
import "./coursedescription.css";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../config";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import Loading from "../../components/Loading";

const CourseDescription = ({ user }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { fetchUser } = UserData();
  const { fetchCourse, course, fetchCourses, fetchMyCourse } = CourseData();

  useEffect(() => {
    if (params.id) {
      fetchCourse(params.id);
    }
  }, [params.id, fetchCourse]);  

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-course.jpg';
    
    const cleanPath = imagePath
      .split('\\')
      .join('/')
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');
    
    return `${server}/uploads/${cleanPath}`;
  };

  const checkoutHandler = async () => {
    if (!user || !course) {
      toast.error("Please wait while we load the course details");
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token); // Debug log
    
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }

    setLoading(true);
  
    try {
      // Generate unique transaction reference
      const tx_ref = `course-${params.id}-${Date.now()}`;
      
      // Get the current origin (protocol + hostname + port)
      const currentOrigin = window.location.origin;
      const return_url = `${currentOrigin}/payment-success`;
      
      // Initialize Chapa payment
      const { data } = await axios.post(
        `${server}/api/payment/initialize`,        
        {          
          amount: course.price,
          email: user.email,
          courseId: params.id,
          userId: user._id,
          courseTitle: course.title,
          return_url, // Add the return URL
          tx_ref // Add the transaction reference
        },
        { 
          headers: { 
            "token": token,
            "Content-Type": "application/json"
          } 
        }
      );
  
      if (data.success && data.checkoutUrl) {
        // Store course ID in session storage for post-payment handling
        sessionStorage.setItem('lastPurchasedCourseId', params.id);
        // Store the correct return URL in session storage
        sessionStorage.setItem('payment_return_url', return_url);
        // Redirect to Chapa checkout page
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
  
    } catch (error) {
      console.error("Payment error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers
      });
      
      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
        localStorage.removeItem("token"); // Clear invalid token
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || "Payment initialization failed");
      }
      setLoading(false);
    }
  };

  if (!course) {
    return <Loading />;
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {course && (
            <div className="course-description">
              <div className="course-header">
                <img
                  src={getImageUrl(course.image)}
                  alt={course.title}
                  className="course-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-course.jpg';
                  }}
                />
                <div className="course-info">
                  <h2>{course.title}</h2>
                  <p>Instructor: {course.createdBy}</p>
                  <p>Duration: {course.duration} weeks</p>
                </div>
              </div>

              <p>{course.description}</p>

              <p>Let's get started with course by ETB {course.price}</p>

              {user && user.subscription && user.subscription.includes(course._id) ? (
                <button
                  onClick={() => navigate(`/course/study/${course._id}`)}
                  className="common-btn"
                >
                  Study
                </button>
              ) : (
                <button 
                  onClick={checkoutHandler} 
                  className="common-btn"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Buy Now"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CourseDescription;