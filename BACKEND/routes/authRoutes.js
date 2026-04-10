import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validateAuth } from '../middleware/eventLogger.js';

const router = express.Router();
const isTest = process.env.NODE_ENV === 'test';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false
});
const authenticatedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 500,
    standardHeaders: true,
    legacyHeaders: false
});

// POST /api/auth/register  — with input validation
router.post('/register', authLimiter, validateAuth, register);

// POST /api/auth/login  — with input validation
router.post('/login', authLimiter, validateAuth, login);

// GET /api/auth/me  — requires JWT
router.get('/me', authenticatedLimiter, auth, getCurrentUser);

// POST /api/auth/verify  — simple student ID verification
router.post('/verify', authLimiter, (req, res) => {
    const { studentId, studentName } = req.body;
    if (!studentId || !studentName) {
        return res.status(400).json({ error: 'Student ID and Name are required' });
    }
    if (!/^[A-Za-z0-9\-]{4,20}$/.test(studentId)) {
        return res.status(422).json({ error: 'Invalid student ID format' });
    }
    res.json({
        success: true,
        message: 'Verification successful',
        user: { studentId: studentId.trim(), studentName: studentName.trim() }
    });
});

export default router;
