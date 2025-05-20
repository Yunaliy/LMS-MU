import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGraduationCap, FaBook, FaUsers, FaCertificate } from 'react-icons/fa';
import { FaTelegram } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { UserData } from "../../context/UserContext";
import "./home.css";
import Testimonials from "../../components/testimonials/Testimonials";

const TELEGRAM_USERNAME = 'aliyrida';

const Home = () => {
  const navigate = useNavigate();
  const { isAuth, user } = UserData();
  const [showHelpText, setShowHelpText] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    if (isAuth) {
      setShowHelpText(true);
      const timer = setTimeout(() => {
        setShowHelpText(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isAuth]);

  // Show chat popup on hover (desktop)
  const handleTelegramHover = () => {
    setShowChat(true);
    setShowHelpText(false); // Hide tooltip when form is open
  };

  const handleSend = () => {
    if (!message.trim()) return; // Don't send empty messages
    
    const userName = user?.name || 'a user';
    const userEmail = user?.email || 'No email provided';
    const formattedMessage = `🏛️ Medinatul uloom help center\n━━━━━━━━━━━━━━━━━━━━━━━\n\n👤 User Details:\n• Name: ${userName}\n• Email: ${userEmail}\n\n💬 Message:\n${message}`;
    const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(formattedMessage)}`;
    window.open(telegramUrl, '_blank');
    setShowChat(false);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const features = [
    {
      icon: <FaGraduationCap />,
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of teaching experience"
    },
    {
      icon: <FaBook />,
      title: "Comprehensive Courses",
      description: "Access a wide range of courses designed to enhance your knowledge"
    },
    {
      icon: <FaUsers />,
      title: "Interactive Learning",
      description: "Engage with fellow learners and instructors in a collaborative environment"
    },
    {
      icon: <FaCertificate />,
      title: "Certified Learning",
      description: "Earn certificates upon completion to showcase your achievements"
    }
  ];

  return (
    <div>
      <div className="home">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Welcome to Medinetul Uloom</h1>
              <p className="hero-subtitle">Your Gateway to Islamic Knowledge and Learning</p>
              <button onClick={() => navigate("/courses")} className="common-btn">
                Explore Courses
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section features-section">
          <div className="container">
            <h2 className="section-title">Why Choose Us</h2>
            <p className="section-subtitle">Experience the best in Islamic education with our comprehensive learning platform</p>
            <div className="grid grid-4">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="section cta-section">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Start Learning?</h2>
              <p className="cta-subtitle">Join our community of learners and begin your journey today</p>
              <button onClick={() => navigate("/register")} className="common-btn">
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* Telegram Floating Button & Chat Popup */}
        {isAuth && (
          <div className="telegram-float-wrapper">
            <div
              className="telegram-float"
              onMouseEnter={handleTelegramHover}
            >
              <FaTelegram className="telegram-icon" />
              {/* Hide tooltip if chat is open */}
              {!showChat && (
                <span className={`telegram-tooltip ${showHelpText ? 'show-help' : ''}`}>
                  {showHelpText ? 'For Any Help' : 'Contact Admin'}
                </span>
              )}
            </div>
            {showChat && (
              <div className="telegram-chat-popup">
                <div className="chat-header">
                  <span>Chat with us on Telegram!</span>
                  <button className="chat-close-btn" onClick={() => setShowChat(false)}><IoMdClose /></button>
                </div>
                <div className="chat-body">
                  <div className="chat-fixed-text">
                    <span className="help-center-title">🏛️ Medinatul uloom help center</span>
                    <p className="help-center-subtitle">How can we assist you today?</p>
                  </div>
                  <textarea
                    className="chat-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    placeholder="Type your message here..."
                    autoFocus
                  />
                  <button 
                    className="chat-send-btn" 
                    onClick={handleSend}
                    disabled={!message.trim()}
                  >
                    <span className="chat-send-arrow">➤</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Testimonials />
    </div>
  );
};

export default Home;
