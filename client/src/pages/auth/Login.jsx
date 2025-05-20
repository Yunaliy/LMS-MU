import React, { useState } from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const { btnLoading, loginUser, loginWithGoogle } = UserData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { fetchMyCourse } = CourseData();

  const submitHandler = async (e) => {
    e.preventDefault();
    await loginUser(email, password, navigate, fetchMyCourse);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(navigate, fetchMyCourse);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Login</h2>
              <form onSubmit={submitHandler}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={btnLoading}
                  >
                    {btnLoading ? "Please Wait..." : "Login"}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-google-hover d-flex align-items-center justify-content-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={btnLoading}
                  >
                    <FcGoogle size={20} />
                    Continue with Google
                  </button>
                </div>

                <div className="text-center mt-3">
                  <p className="mb-2">
                    Don't have an account? <Link to="/register" className="text-decoration-none">Register</Link>
                  </p>
                  <p className="mb-0">
                    <Link to="/forgot" className="text-decoration-none">Forgot password?</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
