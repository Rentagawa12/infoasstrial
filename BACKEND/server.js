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
import { rateLimit, mongoSanitize, securityHeaders } from './middleware/rateLimiter.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Security middleware ───────────────────────────────────────────────────────
app.use(mongoSanitize);

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
// Public routes (with rate limiting)
app.use('/api/items', rateLimit('public'), itemRoutes);
app.use('/api/analytics', rateLimit('public'), analyticsRoutes);

// Authentication routes (strict rate limiting)
app.use('/api/auth', rateLimit('auth'), authRoutes);

// Protected routes (authenticated rate limiting)
app.use('/api/notifications', rateLimit('authenticated'), notificationRoutes);
app.use('/api/keys', rateLimit('authenticated'), apiKeyRoutes);

// ── Health / Monitoring endpoint ──────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        timestamp: new Date().toISOString()
    });
});

// ── Monitoring: recent logs (admin-accessible in production) ─────────────────
app.get('/api/monitor/logs', (req, res) => {
    res.json({ logs: getRecentLogs() });
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
    
    app.listen(PORT, () => {
        console.log('Server running on port ' + PORT);
        console.log('Server URL: http://localhost:' + PORT);
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

export default app;
