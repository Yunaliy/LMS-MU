import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaUsers, FaUserCog, FaMoneyBillWave } from 'react-icons/fa';

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: isActive(path) ? '#1a237e' : '#666',
    backgroundColor: isActive(path) ? '#e8eaf6' : 'transparent',
    textDecoration: 'none',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    margin: '0.25rem 0',
    ':hover': {
      backgroundColor: '#e8eaf6',
      color: '#1a237e'
    }
  });

  return (
    <div style={{
      width: '250px',
      backgroundColor: 'white',
      borderRight: '1px solid #eee',
      height: '100%',
      padding: '1rem',
      position: 'fixed',
      left: 0,
      top: '64px', // Height of AdminHeader
      overflowY: 'auto'
    }}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <Link to="/admin/dashboard" style={linkStyle('/admin/dashboard')}>
          <FaHome size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/admin/courses" style={linkStyle('/admin/courses')}>
          <FaBook size={20} />
          <span>Courses</span>
        </Link>
        <Link to="/admin/users" style={linkStyle('/admin/users')}>
          <FaUsers size={20} />
          <span>Users</span>
        </Link>
        <Link to="/admin/payment-reports" style={linkStyle('/admin/payment-reports')}>
          <FaMoneyBillWave size={20} />
          <span>Payment Reports</span>
        </Link>
        <Link to="/admin/profile" style={linkStyle('/admin/profile')}>
          <FaUserCog size={20} />
          <span>Edit Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar; 