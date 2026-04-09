import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// GET all notifications for current user
router.get('/', getNotifications);

// PATCH mark single notification as read
router.patch('/:id/read', markAsRead);

// PATCH mark all notifications as read
router.patch('/read/all', markAllAsRead);

// DELETE a notification
router.delete('/:id', deleteNotification);

export default router;
