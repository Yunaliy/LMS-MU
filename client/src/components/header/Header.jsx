import React, { useState } from "react";
import "./header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdAccountCircle } from "react-icons/md";
import { UserData } from "../../context/UserContext";
import { server } from "../../config";
import Notification from "../Notification";

const Header = () => {
  const { user, isAuth } = UserData(); // Get both user and isAuth from context
  const [showTooltip, setShowTooltip] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <header className="main-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/" className="logo-link">
              <img
                src="/logo3.png"
                alt="Medinatul Uloom Logo"
                className="img-fluid"
                style={{ maxWidth: "200px" }}
              />
            </Link>
          </div>

          <nav className="main-nav">
            <div className="nav-links">
              <Link 
                to="/" 
                className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link 
                to="/courses" 
                className={`nav-link ${isActivePath('/courses') ? 'active' : ''}`}
              >
                Courses
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
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
                  <Link to="/login" className="auth-button login-button">
                    Login
                  </Link>
                  <Link to="/register" className="auth-button signup-button">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;