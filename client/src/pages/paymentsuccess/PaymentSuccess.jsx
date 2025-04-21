import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { UserData } from '../../context/UserContext';
import { CourseData } from '../../context/CourseContext';
import { server } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';

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
          navigate('/dashboard');
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
          
          // Redirect to dashboard after successful verification
          setTimeout(() => {
            navigate('/dashboard');
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
    <div className="payment-success">
      <h2>Payment Successful!</h2>
      <p>Verifying your payment...</p>
    </div>
  );
};

export default PaymentSuccess;