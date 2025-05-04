import React, { useState, useEffect } from "react";
import "./header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdAccountCircle } from "react-icons/md";
import { UserData } from "../../context/UserContext";
import { server } from "../../config";
import Notification from "../Notification";

const Header = () => {
  const { user, isAuth } = UserData();
  const [showTooltip, setShowTooltip] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Add scroll to top effect when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = null;
    e.target.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.innerHTML = '<MdAccountCircle size={32} color="#757575" />';
    e.target.parentNode.appendChild(fallback);
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Function to handle navigation and ensure scroll to top
  const handleNavigation = (e, path) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate(path);
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link 
          to="/" 
          className="logo"
          onClick={(e) => handleNavigation(e, "/")}
        >
          <img
            src="/logo3.png"
            alt="Medinatul Uloom Logo"
            className="logo-image"
          />
        </Link>

        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
            onClick={(e) => handleNavigation(e, "/")}
          >
            Home
          </Link>
          <Link 
            to="/courses" 
            className={`nav-link ${isActivePath('/courses') ? 'active' : ''}`}
            onClick={(e) => handleNavigation(e, "/courses")}
          >
            Courses
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
            onClick={(e) => handleNavigation(e, "/about")}
          >
            About
          </Link>
        </div>

        <div className="user-section">
          {isAuth ? (
            <>
              <Link 
                to="/account" 
                className="profile-link"
                onClick={(e) => handleNavigation(e, "/account")}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="header-avatar">
                  {user?.image ? (
                    <img 
                      src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`}
                      alt={user.name}
                      onError={handleImageError}
                    />
                  ) : (
                    <MdAccountCircle 
                      size={32} 
                      color="#757575"
                    />
                  )}
                </div>
                {showTooltip && (
                  <div className="profile-tooltip">
                    {user?.name}
                    <div className="tooltip-arrow"></div>
                  </div>
                )}
              </Link>
              <Notification user={user} />
            </>
          ) : (
            <div className="auth-buttons">
              <Link 
                to="/login" 
                className="auth-button login-button"
                onClick={(e) => handleNavigation(e, "/login")}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="auth-button signup-button"
                onClick={(e) => handleNavigation(e, "/register")}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;