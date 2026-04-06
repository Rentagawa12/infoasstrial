import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import itemRoutes from './routes/itemRoutes.js';
import authRoutes from './routes/authRoutes.js';
<<<<<<< HEAD
import multer from 'multer';
=======
import { requestLogger, getRecentLogs } from './middleware/eventLogger.js';
>>>>>>> a74e418 (Changes)
import fs from 'fs';

// Load environment variables
dotenv.config();

<<<<<<< HEAD
// Set default values for environment variables
=======
>>>>>>> a74e418 (Changes)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

<<<<<<< HEAD
// Enhanced CORS configuration
app.use(cors({
    origin: '*',  // Allow all origins during development
=======
// ── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
>>>>>>> a74e418 (Changes)
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

<<<<<<< HEAD
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
=======
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Event-based request logger (message queue middleware) ─────────────────────
app.use(requestLogger);
>>>>>>> a74e418 (Changes)

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

<<<<<<< HEAD
// Serve static files from FRONTEND directory
app.use(express.static(path.join(__dirname, '../FRONTEND')));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// MongoDB connection
=======
// Serve static files
app.use(express.static(path.join(__dirname, '../FRONTEND')));
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);

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
>>>>>>> a74e418 (Changes)
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
<<<<<<< HEAD
        console.log('server running on port ' + PORT);
        console.log('server url: http://localhost:' + PORT);
=======
        console.log('Server running on port ' + PORT);
        console.log('Server URL: http://localhost:' + PORT);
>>>>>>> a74e418 (Changes)
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});
<<<<<<< HEAD
=======

export default app;
>>>>>>> a74e418 (Changes)
