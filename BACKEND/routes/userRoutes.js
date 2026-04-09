import express from 'express';
import {
  getProfile,
  updateProfile,
  getMyItems,
  deleteAccount
} from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(auth);

// GET user profile
router.get('/profile', getProfile);

// PATCH update profile
router.patch('/profile', updateProfile);

// GET user's items
router.get('/my-items', getMyItems);

// DELETE user account
router.delete('/profile', deleteAccount);

export default router;
