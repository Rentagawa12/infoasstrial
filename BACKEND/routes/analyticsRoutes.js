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

const router = express.Router();

// Public analytics endpoints (basic stats)
router.get('/category-distribution', getCategoryDistribution);
router.get('/success-rate', getSuccessRate);

// Protected analytics endpoints
router.get('/dashboard', auth, adminOnly, getDashboard);
router.get('/items', auth, adminOnly, getItemStats);
router.get('/activity-trends', auth, adminOnly, getActivityTrends);
router.get('/user-engagement', auth, adminOnly, getUserEngagement);

// Record analytics event (authenticated users)
router.post('/event', auth, recordEvent);

export default router;
