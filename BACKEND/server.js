import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import itemRoutes from './routes/itemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Notification from './models/notificationModel.js';
import { requestLogger, getRecentLogs, eventBus } from './middleware/eventLogger.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

// ── Security headers with Helmet ──────────────────────────────────────────────
app.use(helmet());

// ── Additional security headers ───────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
app.use('/api/items', itemRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

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

// ── Event listeners for notifications ──────────────────────────────────────────
// Listener for item posted notification
eventBus.on('notification:item_posted', async (data) => {
    try {
        // Log notification (in production, broadcast to subscribers)
        if (process.env.NODE_ENV !== 'test') {
            console.log('[NOTIFICATION_LISTENER] New item posted:', data.itemName);
        }
    } catch (error) {
        console.error('Error processing item_posted notification:', error.message);
    }
});

// Listener for item claimed notification
eventBus.on('notification:item_claimed', async (data) => {
    try {
        // Log notification (in production, find item poster and notify them)
        if (process.env.NODE_ENV !== 'test') {
            console.log('[NOTIFICATION_LISTENER] Item claimed:', data.itemName);
        }
    } catch (error) {
        console.error('Error processing item_claimed notification:', error.message);
    }
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
