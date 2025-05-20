import React from "react";
import "./footer.css";
import {
  AiFillFacebook,
  AiFillTwitterSquare,
  AiFillInstagram,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineEnvironment
} from "react-icons/ai";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>Medinatul-Uloom E-Learning Platform is dedicated to providing quality education and empowering learners worldwide.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact Info</h3>
          <ul className="contact-info">
            <li><AiOutlineMail /> support@medinatul-uloom.com</li>
            <li><AiOutlinePhone /> +1 234 567 890</li>
            <li><AiOutlineEnvironment /> 123 Education Street, Learning City</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><AiFillFacebook /></a>
            <a href="#" aria-label="Twitter"><AiFillTwitterSquare /></a>
            <a href="#" aria-label="Instagram"><AiFillInstagram /></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Medinatul-Uloom E-Learning Platform. All rights reserved.</p>
        <p>Made with ❤️ by <a href="#" className="developer-link">Developer Team</a></p>
      </div>
    </footer>
  );
};

export default Footer;
