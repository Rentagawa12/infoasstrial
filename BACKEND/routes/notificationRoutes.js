import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
} from '../controllers/notificationController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(auth);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', deleteNotification);

// POST /api/notifications - Create notification (admin only)
router.post('/', adminOnly, createNotification);

export default router;
