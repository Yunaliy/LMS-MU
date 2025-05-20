import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from "../controllers/Notification.js";

const router = express.Router();

// Get all notifications for the user
router.get("/notifications", isAuth, getUserNotifications);

// Mark all notifications as read (Specific route FIRST)
router.put("/notifications/mark-all-read", isAuth, markAllNotificationsAsRead);

// Mark single notification as read (Parameterized route AFTER specific one)
router.put("/notifications/:id", isAuth, markNotificationAsRead);

// Clear read notifications
router.delete("/notifications/clear-read", isAuth, clearReadNotifications);

export default router;
