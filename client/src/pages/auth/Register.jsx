import React, { useState } from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const { btnLoading, registerUser, loginWithGoogle } = UserData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  // const [image, setImage] = useState(null);

  // const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     // Validate file type
  //     if (!file.type.startsWith('image/')) {
  //       setError("Please select an image file");
  //       return;
  //     }
  //     // Validate file size (5MB limit)
  //     if (file.size > 5 * 1024 * 1024) {
  //       setError("Image size should be less than 5MB");
  //       return;
  //     }
  //     setError("");
  //     setImage(file);
      
  //     // Create preview URL
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const validatePassword = (pw) => {
    if (pw.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (!/[a-zA-Z]/.test(pw)) {
        return "Password must contain at least one letter.";
    }
    if (!/\d/.test(pw)) {
        return "Password must contain at least one number.";
    }
    if (/(.)\1\1/.test(pw)) {
        return "Password cannot contain sequences of 3 or more identical characters.";
    }
    return "";
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError) {
        setError(passwordError);
        return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    await registerUser(name, email, password, navigate);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(navigate);
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
              <h2 className="text-center mb-4">Register</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={submitHandler}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

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
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <span 
                        className="password-toggle-icon"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                   <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                     <span 
                        className="password-toggle-icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                {/* <div className="mb-3">
                  <label htmlFor="image" className="form-label">Profile Image</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="form-control"
                    />
                    {imagePreview && (
                      <div className="mt-2 text-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="img-thumbnail"
                          style={{ maxWidth: '150px', maxHeight: '150px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm mt-2"
                          onClick={() => {
                            setImage(null);
                            setImagePreview("");
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div> */}

                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={btnLoading}
                  >
                    {btnLoading ? "Please Wait..." : "Register"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={btnLoading}
                  >
                    <FcGoogle size={20} />
                    Continue with Google
                  </button>
                </div>

                <div className="text-center mt-3">
                  <p className="mb-0">
                    Have an account? <Link to="/login" className="text-decoration-none">Login</Link>
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

export default Register;
