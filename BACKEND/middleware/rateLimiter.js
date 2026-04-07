/**
 * Rate Limiting and Security Middleware
 * Protects API from abuse and DDoS attacks
 */

import { eventBus } from './eventLogger.js';

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map();
const blockedIPs = new Set();

/**
 * Rate limiter configuration
 * In test mode, use much higher limits to avoid false positives
 */
const isTest = process.env.NODE_ENV === 'test';

const RATE_LIMITS = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 10000 : 100 // 100 requests per window in production
  },
  authenticated: {
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 500 // 500 requests per window in production
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 10 // 10 login/register attempts per window in production
  },
  strict: {
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 30 // For sensitive operations in production
  }
};

/**
 * Get client identifier (IP + user ID if authenticated)
 */
const getClientId = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.userId;
  return userId ? `user:${userId}` : `ip:${ip}`;
};

/**
 * Rate limit middleware factory
 */
export const rateLimit = (limitType = 'public') => {
  return (req, res, next) => {
    const clientId = getClientId(req);
    const config = RATE_LIMITS[limitType];
    
    if (!config) {
      return next();
    }
    
    // Check if IP is blocked
    if (blockedIPs.has(req.ip)) {
      eventBus.emit('security', { 
        message: 'Blocked IP attempted access',
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({ 
        error: 'Access denied. IP has been blocked due to suspicious activity.' 
      });
    }
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get or create client record
    if (!requestCounts.has(clientId)) {
      requestCounts.set(clientId, []);
    }
    
    const requests = requestCounts.get(clientId);
    
    // Filter out old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= config.max) {
      eventBus.emit('security', { 
        message: 'Rate limit exceeded',
        clientId,
        ip: req.ip,
        path: req.path,
        requestCount: recentRequests.length,
        limit: config.max
      });
      
      // Block IP if repeatedly exceeding limits
      if (recentRequests.length > config.max * 2) {
        blockedIPs.add(req.ip);
        eventBus.emit('security', { 
          message: 'IP blocked for excessive requests',
          ip: req.ip
        });
      }
      
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(config.windowMs / 1000),
        limit: config.max,
        windowMs: config.windowMs
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requestCounts.set(clientId, recentRequests);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', config.max - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());
    
    next();
  };
};

/**
 * Clean up old request counts periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [clientId, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > now - 15 * 60 * 1000);
    if (recentRequests.length === 0) {
      requestCounts.delete(clientId);
    } else {
      requestCounts.set(clientId, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Unblock IP (admin function)
 */
export const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  eventBus.emit('security', { 
    message: 'IP unblocked',
    ip
  });
};

/**
 * Get blocked IPs (admin function)
 */
export const getBlockedIPs = () => {
  return Array.from(blockedIPs);
};

/**
 * Request size limiter
 * Already handled in server.js with express.json({ limit: '10kb' })
 */

/**
 * Prevent XSS attacks
 */
export const xssProtection = (req, res, next) => {
  // Basic XSS sanitization for string fields
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Don't sanitize password fields
        if (!key.toLowerCase().includes('password')) {
          req.body[key] = sanitize(req.body[key]);
        }
      }
    }
  }
  
  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    }
  }
  
  next();
};

/**
 * MongoDB injection protection
 */
export const mongoSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      // Remove keys that start with $ (MongoDB operators)
      if (key.startsWith('$')) {
        delete obj[key];
        eventBus.emit('security', { 
          message: 'MongoDB injection attempt detected',
          key,
          ip: req.ip,
          path: req.path
        });
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    
    return obj;
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

/**
 * CSRF protection token generator
 */
export const generateCSRFToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * Helmet-like security headers (already in server.js, but enhanced here)
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Updated CSP to allow:
  // - External fonts from Google Fonts
  // - External stylesheets from CDNs (Font Awesome, etc.)
  // - Inline styles and scripts (needed for single-file HTML app)
  // - External images from tip.edu.ph (background image)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: https://www.tip.edu.ph; " +
    "connect-src 'self'"
  );
  
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
};

export default {
  rateLimit,
  xssProtection,
  mongoSanitize,
  securityHeaders,
  unblockIP,
  getBlockedIPs
};
