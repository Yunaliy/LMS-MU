import React from "react";
import { useNavigate } from "react-router-dom";
import { FaGraduationCap, FaBook, FaUsers, FaCertificate } from 'react-icons/fa';
import "./home.css";
import Testimonials from "../../components/testimonials/Testimonials";

const Home = () => {
  const navigate = useNavigate();
  
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
      </div>
      <Testimonials />
    </div>
  );
};

export default Home;
