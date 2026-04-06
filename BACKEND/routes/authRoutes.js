import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
<<<<<<< HEAD

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);

// Simple verification route
router.post('/verify', (req, res) => {
    const { studentId, studentName } = req.body;
    
    // Basic validation
    if (!studentId || !studentName) {
        return res.status(400).json({ error: 'Student ID and Name are required' });
    }
    
    // In a real application, you would verify against a database
    res.json({ 
        success: true, 
        message: 'Verification successful',
        user: { studentId, studentName }
    });
});

export default router; 
=======
import { validateAuth } from '../middleware/eventLogger.js';

const router = express.Router();

// POST /api/auth/register  — with input validation
router.post('/register', validateAuth, register);

// POST /api/auth/login  — with input validation
router.post('/login', validateAuth, login);

// GET /api/auth/me  — requires JWT
router.get('/me', auth, getCurrentUser);

// POST /api/auth/verify  — simple student ID verification
router.post('/verify', (req, res) => {
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
>>>>>>> a74e418 (Changes)
