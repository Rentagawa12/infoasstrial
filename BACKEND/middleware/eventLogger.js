/**
 * Event-Based Middleware / Integration Mechanism
 * Simulates a message queue / event bus for request logging and monitoring.
 * In production, replace the in-memory queue with RabbitMQ or Redis Pub/Sub.
 */
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── In-memory event bus (message queue simulation) ──────────────────────────
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(20);

// In-memory log store (acts as the message queue consumer's storage)
const logs = [];

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, 'app.log');

// ── Consumer: persist log events ─────────────────────────────────────────────
eventBus.on('log', (entry) => {
  logs.push(entry);
  if (logs.length > 1000) logs.shift(); // cap in-memory ring buffer
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(logFile, line);
});

eventBus.on('security', (entry) => {
  const line = JSON.stringify({ ...entry, type: 'SECURITY' }) + '\n';
  fs.appendFileSync(logFile, line);
  console.warn('[SECURITY]', entry.message, entry.meta || '');
});

// ── Producer: Express request-logger middleware ───────────────────────────────
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      userId: req.user?.userId || null,
    };
    // Publish to event bus (message queue)
    eventBus.emit('log', entry);

    // Console output for development visibility
    const colour = res.statusCode >= 500 ? '\x1b[31m'
      : res.statusCode >= 400 ? '\x1b[33m'
      : '\x1b[32m';
    console.log(`${colour}[${entry.timestamp}] ${entry.method} ${entry.path} ${entry.status} (${entry.durationMs}ms)\x1b[0m`);
  });

  next();
};

// ── Input validation middleware ───────────────────────────────────────────────
export const validateItem = (req, res, next) => {
  const { itemName, description, category, dateLostOrFound, status, contactInfo, studentId, studentName } = req.body;

  const errors = [];

  if (!itemName || typeof itemName !== 'string' || itemName.trim().length < 2)
    errors.push('itemName must be at least 2 characters.');
  if (!description || description.trim().length < 5)
    errors.push('description must be at least 5 characters.');
  const validCategories = ['electronics', 'accessories', 'documents', 'clothing', 'books', 'others'];
  if (!category || !validCategories.includes(category))
    errors.push(`category must be one of: ${validCategories.join(', ')}.`);
  if (!dateLostOrFound || isNaN(Date.parse(dateLostOrFound)))
    errors.push('dateLostOrFound must be a valid date.');
  const validStatuses = ['lost', 'found', 'claimed'];
  if (!status || !validStatuses.includes(status))
    errors.push(`status must be one of: ${validStatuses.join(', ')}.`);
  if (!contactInfo || contactInfo.trim().length < 5)
    errors.push('contactInfo must be at least 5 characters.');
  if (!studentId || !/^[A-Za-z0-9\-]{4,20}$/.test(studentId))
    errors.push('studentId must be 4–20 alphanumeric characters.');
  if (!studentName || studentName.trim().length < 2)
    errors.push('studentName must be at least 2 characters.');

  if (errors.length > 0) {
    eventBus.emit('security', { message: 'Item validation failed', meta: errors, ip: req.ip });
    return res.status(422).json({ errors });
  }

  // Sanitise strings
  req.body.itemName = itemName.trim();
  req.body.description = description.trim();
  req.body.studentName = studentName.trim();
  req.body.contactInfo = contactInfo.trim();

  next();
};

export const validateAuth = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('A valid email is required.');
  if (!password || password.length < 6)
    errors.push('Password must be at least 6 characters.');
  if (errors.length > 0) {
    eventBus.emit('security', { message: 'Auth validation failed', meta: errors, ip: req.ip });
    return res.status(422).json({ errors });
  }
  next();
};

// ── Monitoring endpoint helper ────────────────────────────────────────────────
export const getRecentLogs = () => logs.slice(-100);
