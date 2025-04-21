import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../Utils/Layout";
import axios from "axios";
import { server } from "../../config";
import { FaBook, FaChalkboardTeacher, FaUsers, FaChartLine, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import "./dashboard.css";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();

  // Redirect if not admin
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalLectures: 0,
    totalUsers: 0,
    loading: true,
    error: null
  });

  const [assessmentStatus, setAssessmentStatus] = useState({
    isPassed: false,
    score: 0
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await axios.get(`${server}/api/stats`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      // Handle both response structures and potential misspellings
      const responseData = data.stats || data;
      setStats({
        totalCourses: responseData.totalCourses || responseData.totalCoures || 0,
        totalLectures: responseData.totalLectures || 0,
        totalUsers: responseData.totalUsers || 0,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error("Dashboard stats error:", error);
      const errorMsg = error.response?.data?.message || "Failed to load dashboard statistics";
      setStats({
        totalCourses: 0,
        totalLectures: 0,
        totalUsers: 0,
        loading: false,
        error: errorMsg
      });
      toast.error(errorMsg);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>
            <FaChartLine className="icon-primary" />
            Admin Dashboard
          </h2>
          <button 
            onClick={fetchStats} 
            className="refresh-btn"
            disabled={stats.loading}
          >
            <FaSyncAlt className={stats.loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {stats.error && (
          <div className="alert error">
            {stats.error}
          </div>
        )}

        {stats.loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <div className="horizontal-cards-container">
            {/* Courses Card */}
            <div className="stat-card primary">
              <div className="card-content">
                <div className="stat-icon">
                  <FaBook />
                </div>
                <div className="stat-text">
                  <p className="stat-label">Total Courses</p>
                  <p className="stat-value">{stats.totalCourses}</p>
                </div>
              </div>
            </div>

            {/* Lectures Card */}
            <div className="stat-card success">
              <div className="card-content">
                <div className="stat-icon">
                  <FaChalkboardTeacher />
                </div>
                <div className="stat-text">
                  <p className="stat-label">Total Lectures</p>
                  <p className="stat-value">{stats.totalLectures}</p>
                </div>
              </div>
            </div>

            {/* Users Card */}
            <div className="stat-card info">
              <div className="card-content">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-text">
                  <p className="stat-label">Total Users</p>
                  <p className="stat-value">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;