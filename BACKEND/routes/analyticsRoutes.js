import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDashboard,
  getItemStats,
  getActivityTrends,
  getUserEngagement,
  recordEvent,
  getCategoryDistribution,
  getSuccessRate
} from '../controllers/analyticsController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const isTest = process.env.NODE_ENV === 'test';
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false
});
const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false
});

// Public analytics endpoints (basic stats)
router.get('/category-distribution', publicLimiter, getCategoryDistribution);
router.get('/success-rate', publicLimiter, getSuccessRate);

// Protected analytics endpoints
router.get('/dashboard', authenticatedLimiter, auth, adminOnly, getDashboard);
router.get('/items', authenticatedLimiter, auth, adminOnly, getItemStats);
router.get('/activity-trends', authenticatedLimiter, auth, adminOnly, getActivityTrends);
router.get('/user-engagement', authenticatedLimiter, auth, adminOnly, getUserEngagement);

// Record analytics event (authenticated users)
router.post('/event', authenticatedLimiter, auth, recordEvent);

export default router;
