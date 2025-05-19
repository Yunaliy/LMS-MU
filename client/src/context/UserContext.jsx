import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { server } from "../config";
import toast, { Toaster } from "react-hot-toast";

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loginUser(email, password, navigate, fetchMyCourse) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${server}/api/login`, {
        email,
        password,
      });

      if (data.success) {
        console.log("Login response:", data);
        toast.success(data.message);
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setIsAuth(true);
        setBtnLoading(false);
        
        // If user is admin, redirect to admin dashboard
        if (data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
        navigate("/");
        }
        
        fetchMyCourse && fetchMyCourse();
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      setBtnLoading(false);
      setIsAuth(false);
      toast.error(error.response?.data?.message || 'Login failed');
    }
  }

  const registerUser = async (name, email, password, navigate) => {
    setBtnLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      // if (image) {
      //   formData.append('image', image);
      // }

      const { data } = await axios.post(`${server}/api/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        toast.success(data.message);
        localStorage.setItem("activationToken", data.activationToken);
        setBtnLoading(false);
        navigate("/verify");
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  async function verifyOtp(otp, navigate) {
    setBtnLoading(true);
    const activationToken = localStorage.getItem("activationToken");
    try {
      const { data } = await axios.post(`${server}/api/verify`, {
        otp,
        activationToken,
      });

      if (data.success) {
        toast.success(data.message);
        navigate("/login");
        localStorage.clear();
        setBtnLoading(false);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setBtnLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${server}/api/me`, {
        headers: {
          token: token
        }
      });

      console.log("Fetch user response:", data);

      if (data.success) {
        setIsAuth(true);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
      setIsAuth(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const loginWithGoogle = async (navigate, fetchMyCourse) => {
    setBtnLoading(true);
    try {
      // Fetch Google Client ID from server
      const response = await fetch('http://localhost:5000/api/auth/google-client-id');
      const data = await response.json();
      
      if (!data.success || !data.clientId) {
        throw new Error('Failed to get Google Client ID');
      }

      // Create Google OAuth URL
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${data.clientId}` +
        `&redirect_uri=${encodeURIComponent('http://localhost:5173/auth/google/callback')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')}` +
        `&prompt=select_account` +
        `&access_type=offline`;

      console.log('Opening Google OAuth URL:', googleAuthUrl);

      // Open Google OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        googleAuthUrl,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Create a promise to handle the OAuth response
      const authPromise = new Promise((resolve, reject) => {
        const handleMessage = (event) => {
          console.log('Message received in main window:', {
            origin: event.origin,
            data: event.data,
            expectedOrigin: 'http://localhost:5173'
          });
          
          if (event.origin === 'http://localhost:5173') {
            // Remove the event listener
            window.removeEventListener('message', handleMessage);
            
            if (event.data.error) {
              console.error('Error from popup:', event.data.error);
              reject(new Error(event.data.error));
              return;
            }

            const { token, user: userData } = event.data;
            console.log('Received data from popup:', { 
              hasToken: !!token, 
              hasUserData: !!userData,
              userData: userData 
            });
            
            if (!token || !userData) {
              reject(new Error('Invalid response from popup: missing token or user data'));
              return;
            }

            resolve({ token, userData });
          } else {
            console.warn('Received message from unexpected origin:', event.origin);
          }
        };

        // Add the event listener
        window.addEventListener('message', handleMessage);
        console.log('Added message event listener');

        // Set a timeout to reject if no response is received
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication timed out'));
        }, 30000); // Increased timeout to 30 seconds
      });

      // Wait for the authentication to complete
      const { token, userData } = await authPromise;
      console.log('Authentication successful:', { 
        hasToken: !!token, 
        hasUserData: !!userData,
        userData: userData 
      });
      
      // Process successful authentication
      localStorage.setItem("token", token);
      setUser(userData);
      setIsAuth(true);
      toast.success("Successfully logged in with Google!");
      
      if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
      
      fetchMyCourse && fetchMyCourse();

    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message || "Failed to login with Google");
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        setIsAuth,
        isAuth,
        loginUser,
        btnLoading,
        loading,
        registerUser,
        verifyOtp,
        fetchUser,
        loginWithGoogle,
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
