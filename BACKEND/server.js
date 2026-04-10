import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import itemRoutes from './routes/itemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import { requestLogger, getRecentLogs } from './middleware/eventLogger.js';
import { initializeOrchestration } from './middleware/orchestration.js';
import { rateLimit, mongoSanitize, xssProtection, securityHeaders } from './middleware/rateLimiter.js';
import rateLimitExpress from 'express-rate-limit';
import fs from 'fs';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const defaultAllowedOrigins = [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://localhost:5173',
    'https://127.0.0.1:5173',
    'https://localhost:5500',
    'https://127.0.0.1:5500',
    'https://localhost:8080',
    'https://127.0.0.1:8080',
].filter(Boolean);
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const effectiveAllowedOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins;
const normalizeOrigin = (value) => {
    try {
        const parsed = new URL(value);
        return `${parsed.protocol}//${parsed.host}`.toLowerCase();
    } catch {
        return '';
    }
};
const normalizedAllowedOrigins = new Set(effectiveAllowedOrigins.map(normalizeOrigin).filter(Boolean));
const isTest = process.env.NODE_ENV === 'test';
const publicLimiter = rateLimitExpress({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false
});
const strictLimiter = rateLimitExpress({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 30,
    standardHeaders: true,
    legacyHeaders: false
});

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        const normalizedOrigin = normalizeOrigin(origin);
        if (!normalizedOrigin) {
            return callback(new Error('CORS origin not allowed'));
        }
        if (normalizedAllowedOrigins.has(normalizedOrigin)) {
            return callback(null, true);
        }
        if (normalizedOrigin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Security middleware ───────────────────────────────────────────────────────
app.use(mongoSanitize);
app.use(xssProtection);

// ── Event-based request logger (message queue middleware) ─────────────────────
app.use(requestLogger);

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use(express.static(path.join(__dirname, '../FRONTEND')));
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ────────────────────────────────────────────────────────────────
// Route modules include endpoint-level rate limiting
app.use('/api/items', itemRoutes);
app.use('/api/analytics', analyticsRoutes);

// Route modules include endpoint-level rate limiting
app.use('/api/auth', authRoutes);

// Route modules include endpoint-level rate limiting
app.use('/api/notifications', notificationRoutes);
app.use('/api/keys', apiKeyRoutes);

// ── Health / Monitoring endpoint ──────────────────────────────────────────────
app.get('/health', rateLimit('public'), (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        timestamp: new Date().toISOString()
    });
});

// ── Monitoring: recent logs (admin-accessible in production) ─────────────────
app.get('/api/monitor/logs', strictLimiter, (req, res) => {
    res.json({ logs: getRecentLogs() });
});

// ── Serve frontend for all non-API routes (SPA fallback) ─────────────────────
app.get('*', publicLimiter, (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path === '/health') {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../FRONTEND/index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── MongoDB + Server start ────────────────────────────────────────────────────
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize API orchestration layer
    initializeOrchestration();
    
    // Only start listening if not in test mode
    // Tests import the app but don't need it to listen on a port
    if (process.env.NODE_ENV !== 'test') {
        app.listen(PORT, () => {
            console.log('Server running on port ' + PORT);
            console.log('Server URL: http://localhost:' + PORT);
        });
    }
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

export default app;
