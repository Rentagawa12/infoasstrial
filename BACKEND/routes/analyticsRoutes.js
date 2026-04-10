import express from 'express';
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
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public analytics endpoints (basic stats)
router.get('/category-distribution', rateLimit('public'), getCategoryDistribution);
router.get('/success-rate', rateLimit('public'), getSuccessRate);

// Protected analytics endpoints
router.get('/dashboard', rateLimit('authenticated'), auth, adminOnly, getDashboard);
router.get('/items', rateLimit('authenticated'), auth, adminOnly, getItemStats);
router.get('/activity-trends', rateLimit('authenticated'), auth, adminOnly, getActivityTrends);
router.get('/user-engagement', rateLimit('authenticated'), auth, adminOnly, getUserEngagement);

// Record analytics event (authenticated users)
router.post('/event', rateLimit('authenticated'), auth, recordEvent);

export default router;
