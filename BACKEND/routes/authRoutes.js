import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validateAuth } from '../middleware/eventLogger.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register  — with input validation
router.post('/register', rateLimit('auth'), validateAuth, register);

// POST /api/auth/login  — with input validation
router.post('/login', rateLimit('auth'), validateAuth, login);

// GET /api/auth/me  — requires JWT
router.get('/me', rateLimit('authenticated'), auth, getCurrentUser);

// POST /api/auth/verify  — simple student ID verification
router.post('/verify', rateLimit('auth'), (req, res) => {
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
