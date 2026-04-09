import express from 'express';
import {
  getDashboard,
  getAllUsers,
  getAllItems,
  deleteUserById,
  deleteItemById,
  getSystemLogs
} from '../controllers/adminController.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminOnly);

// GET dashboard statistics
router.get('/dashboard', getDashboard);

// GET all users
router.get('/users', getAllUsers);

// GET all items
router.get('/items', getAllItems);

// DELETE user by ID
router.delete('/users/:id', deleteUserById);

// DELETE item by ID
router.delete('/items/:id', deleteItemById);

// GET system logs
router.get('/logs', getSystemLogs);

export default router;
