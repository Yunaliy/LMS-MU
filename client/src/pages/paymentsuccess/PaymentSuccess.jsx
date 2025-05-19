import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { UserData } from '../../context/UserContext';
import { CourseData } from '../../context/CourseContext';
import { server } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser, setIsAuth } = UserData();
  const { fetchCourses, fetchMyCourse } = CourseData();
  const messageShownRef = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        console.log("Token found:", !!token); // Debug log
        
        if (!token) {
          // If no token, try to get it from sessionStorage
          const sessionToken = sessionStorage.getItem("token");
          if (sessionToken) {
            localStorage.setItem("token", sessionToken);
          } else {
            throw new Error("No authentication token found");
          }
        }

        // Extract parameters from URL
        const searchParams = new URLSearchParams(location.search);
        const tx_ref = searchParams.get('tx_ref') || searchParams.get('trx_ref');
        const status = searchParams.get('status');
    
        console.log("URL Parameters:", {
          tx_ref,
          status,
          search: location.search
        });
    
        if (!tx_ref) {
          throw new Error("No transaction reference found");
        }

        // Check if success message has already been shown for this transaction
        const messageKey = `payment_success_${tx_ref}`;
        const messageShown = sessionStorage.getItem(messageKey);
        
        if (messageShown === 'true' || messageShownRef.current) {
          console.log("Success message already shown for this transaction");
          const lastPurchasedCourseId = sessionStorage.getItem('lastPurchasedCourseId');
          if (lastPurchasedCourseId) {
            navigate(`/course/study/${lastPurchasedCourseId}`);
          } else {
          navigate('/dashboard');
          }
          return;
        }

        // Only proceed with verification if we have a transaction reference
        console.log("Verifying payment with tx_ref:", tx_ref); // Debug log
    
        const response = await axios.post(
          `${server}/api/payment/verify-enroll`,
          { tx_ref },
          {
            headers: {
              "token": token,
              "Content-Type": "application/json"
            }
          }
        );
    
        console.log("Verification response:", response.data); // Debug log
    
        if (response.data.success) {
          // Refresh user data and set auth state
          await fetchUser();
          setIsAuth(true);
          await fetchCourses();
          await fetchMyCourse();
          
          // Show success message and mark it as shown
          if (!messageShownRef.current) {
            toast.success(response.data.message || "Payment verified successfully!");
            messageShownRef.current = true;
            sessionStorage.setItem(messageKey, 'true');
          }
          
          // Get the course ID from session storage
          const lastPurchasedCourseId = sessionStorage.getItem('lastPurchasedCourseId');
          
          // Redirect to the course study page or dashboard
          setTimeout(() => {
            if (lastPurchasedCourseId) {
              navigate(`/course/study/${lastPurchasedCourseId}`);
              sessionStorage.removeItem('lastPurchasedCourseId'); // Clean up
            } else {
            navigate('/dashboard');
            }
          }, 2000);
        } else {
          throw new Error(response.data.message || "Payment verification failed");
        }
        
      } catch (error) {
        console.error("Verification error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        let errorMessage = "Payment verification failed";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        navigate('/payment-error', {
          state: { error: errorMessage }
        });
      }
    };

    verifyPayment();
  }, [navigate, fetchUser, fetchCourses, fetchMyCourse, location.search, setIsAuth]);

  return (
    <div className="payment-success-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bs-body-bg, #f5f5f5)' }}>
      <div className="payment-success-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative' }}>
        <div style={{ marginBottom: 24 }}>
          <FaCheckCircle size={64} color="#4caf50" />
        </div>
        <h2 style={{ color: '#4caf50', marginBottom: 12 }}>Payment Successful!</h2>
        <p style={{ color: '#333', fontSize: 18, marginBottom: 16 }}>Verifying your payment...</p>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 24 }}>
          We have emailed you a confirmation message and receipt to your email.<br />
          Further communication will be through your email.
        </p>
      <Loading />
        <button
          style={{ marginTop: 32, background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 16, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;