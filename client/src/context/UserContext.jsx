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
        toast.success(data.message);
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setIsAuth(true);
        setBtnLoading(false);
        navigate("/");
        fetchMyCourse();
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
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

      if (data.success) {
        setIsAuth(true);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }

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
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
