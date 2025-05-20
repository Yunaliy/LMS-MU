import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { server } from '../config';
import toast from 'react-hot-toast';
import './notification.css';
import { UserData } from '../context/UserContext';
import { FaTrash, FaCheck } from 'react-icons/fa';
//import mongoose from 'mongoose';

const Notification = () => {
  const { user, isAuth } = UserData();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuth) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${server}/api/notifications`, {
        headers: {
          token: token
        },
      });
      
      if (data.success) {
        setNotifications(data.notifications || []);
        const unreadNotifications = (data.notifications || []).filter(n => !n.read);
        setUnreadCount(unreadNotifications.length);
      } else {
        console.warn('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 403) {
        // Handle authentication error silently
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // --- Enhanced Validation ---
      if (!id) {
        console.error('Mark as read attempt with missing ID.');
        toast.error('Cannot mark notification as read (missing ID)');
        return;
      }
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(id)) {
         console.error('Mark as read attempt with invalid ID format:', id);
         toast.error('Cannot mark notification as read (invalid ID format)');
         return;
      }
      // --- End Enhanced Validation ---

      console.log("Attempting to mark notification as read. ID being sent:", id, typeof id);

      const { data } = await axios.put(
        `${server}/api/notifications/${id}`,
        {},
        {
          headers: {
            token: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (data.success) {
        await fetchNotifications(); // Refresh notifications
      } else {
        throw new Error(data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response) {
        console.error('Backend Error Response:', error.response.data);
      }
      toast.error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const { data } = await axios.put(
        `${server}/api/notifications/mark-all-read`,
        {},
        {
          headers: {
            token: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (data.success) {
        console.log("Mark all successful on backend. Refetching notifications..."); // Log before refetch
        await fetchNotifications(); // Refresh notifications
        // ***** ADD THESE LOGS *****
        console.log("Notifications refetched. Current unread count:", unreadCount);
        // Use a functional update for setNotifications to guarantee access to latest state
        setNotifications(currentNotifications => {
            console.log("Notifications state after refetch:", currentNotifications);
            return currentNotifications; // Return the same state just for logging
        });
        // *************************

        if (data.modifiedCount > 0) {
          toast.success(`Marked ${data.modifiedCount} notification${data.modifiedCount === 1 ? '' : 's'} as read`);
        } else {
          toast.success('No unread notifications to mark');
        }
      } else {
        throw new Error(data.message || 'Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast.error('Authentication required');
      } else if (error.response?.status === 404) {
        toast.error('No notifications found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to mark all notifications as read');
      }
    }
  };

  const clearReadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const { data } = await axios.delete(
        `${server}/api/notifications/clear-read`,
        {
          headers: {
            token: token
          }
        }
      );
      
      if (data.success) {
        await fetchNotifications(); // Refresh notifications
        if (data.deletedCount > 0) {
          toast.success(`Cleared ${data.deletedCount} read notification${data.deletedCount === 1 ? '' : 's'}`);
        } else {
          toast.success('No read notifications to clear');
        }
      } else {
        throw new Error(data.message || 'Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to clear notifications');
    }
  };

  useEffect(() => {
    if (isAuth) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuth]);

  if (!isAuth) return null;

  return (
    <div className="notification-container">
      <div 
        className="notification-bell" 
        onClick={() => setShowNotifications(!showNotifications)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge" title={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        )}
      </div>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="action-btn mark-all-btn"
                  title="Mark all as read"
                >
                  <FaCheck /> Mark all read
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button 
                  onClick={clearReadNotifications}
                  className="action-btn clear-btn"
                  title="Clear read notifications"
                >
                  <FaTrash /> Clear read
                </button>
              )}
            </div>
          </div>
          <div className="notification-list">
            {loading ? (
              <p className="loading">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                  {!notification.read && (
                    <span className="unread-indicator" title="Unread notification"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
