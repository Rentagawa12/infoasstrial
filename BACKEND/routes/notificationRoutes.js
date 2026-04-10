import express from 'express';
import rateLimit from 'express-rate-limit';
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
const isTest = process.env.NODE_ENV === 'test';
const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false
});
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false
});

// All notification routes require authentication
router.use(authenticatedLimiter);
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
router.post('/', strictLimiter, adminOnly, createNotification);

export default router;
