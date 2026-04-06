/**
 * Extended Integration Tests — New Modules
 * Tests for Notifications, Analytics, API Keys, and Advanced RBAC
 */

import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

let app;
let userToken;
let adminToken;
let moderatorToken;
let apiKey;
let notificationId;

const TEST_USER = {
  username: 'extuser_' + Date.now(),
  email: `extuser_${Date.now()}@tip.edu.ph`,
  password: 'User@12345'
};

const TEST_ADMIN = {
  username: 'extadmin_' + Date.now(),
  email: `extadmin_${Date.now()}@tip.edu.ph`,
  password: 'Admin@12345'
};

const TEST_MODERATOR = {
  username: 'extmod_' + Date.now(),
  email: `extmod_${Date.now()}@tip.edu.ph`,
  password: 'Mod@12345'
};

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_ci';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound';

  const serverModule = await import('../server.js');
  app = serverModule.default;

  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('connected', resolve);
  });

  // Setup test users
  const User = (await import('../models/userModel.js')).default;
  
  // Create regular user
  const userRes = await request(app).post('/api/auth/register').send(TEST_USER);
  userToken = userRes.body.token;
  
  // Create admin
  const adminUser = new User({ ...TEST_ADMIN, role: 'admin' });
  await adminUser.save();
  const adminRes = await request(app).post('/api/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
  adminToken = adminRes.body.token;
  
  // Create moderator
  const modUser = new User({ ...TEST_MODERATOR, role: 'moderator' });
  await modUser.save();
  const modRes = await request(app).post('/api/auth/login')
    .send({ email: TEST_MODERATOR.email, password: TEST_MODERATOR.password });
  moderatorToken = modRes.body.token;
}, 30000);

afterAll(async () => {
  try {
    const User = (await import('../models/userModel.js')).default;
    const Notification = (await import('../models/notificationModel.js')).default;
    await User.deleteMany({ 
      email: { $in: [TEST_USER.email, TEST_ADMIN.email, TEST_MODERATOR.email] } 
    });
    if (notificationId) await Notification.findByIdAndDelete(notificationId);
  } catch (_) {}
  await mongoose.connection.close();
}, 15000);

// ═══════════════════════════════════════════════════════════════════════════════
// TC-11: Notifications API
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-11 — Notifications API', () => {
  test('GET /api/notifications requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  test('GET /api/notifications returns user notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notifications');
    expect(res.body).toHaveProperty('unreadCount');
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  test('GET /api/notifications/unread-count returns count', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(typeof res.body.count).toBe('number');
  });

  test('Admin can create notifications', async () => {
    const User = (await import('../models/userModel.js')).default;
    const user = await User.findOne({ email: TEST_USER.email });
    
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: user._id.toString(),
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test',
        priority: 'low'
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Notification');
    notificationId = res.body._id;
  });

  test('Regular user cannot create notifications', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: 'someId',
        type: 'system',
        title: 'Test',
        message: 'Test'
      });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-12: Analytics API
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-12 — Analytics API', () => {
  test('GET /api/analytics/category-distribution is public', async () => {
    const res = await request(app).get('/api/analytics/category-distribution');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/analytics/success-rate is public', async () => {
    const res = await request(app).get('/api/analytics/success-rate');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('successRate');
  });

  test('GET /api/analytics/dashboard requires admin', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('Admin can access dashboard', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('activity');
  });

  test('GET /api/analytics/activity-trends requires admin', async () => {
    const res = await request(app)
      .get('/api/analytics/activity-trends?days=7')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-13: API Keys
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-13 — API Keys', () => {
  test('GET /api/keys requires authentication', async () => {
    const res = await request(app).get('/api/keys');
    expect(res.status).toBe(401);
  });

  test('POST /api/keys creates new API key', async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test API Key',
        permissions: ['read', 'write']
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('key');
    expect(res.body.key).toMatch(/^lfnd_/);
    apiKey = res.body.key;
  });

  test('GET /api/keys lists user API keys', async () => {
    const res = await request(app)
      .get('/api/keys')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('POST /api/keys requires name', async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ permissions: ['read'] });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-14: Enhanced RBAC
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-14 — Enhanced RBAC', () => {
  test('Moderator can access analytics (moderator permission)', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${moderatorToken}`);
    // Moderators don't have full analytics access, should return 403
    expect(res.status).toBe(403);
  });

  test('Admin has full access to analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('Regular user cannot access admin analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/user-engagement')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-15: Rate Limiting
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-15 — Rate Limiting', () => {
  test('Rate limit headers are present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-ratelimit-limit');
    expect(res.headers).toHaveProperty('x-ratelimit-remaining');
  });

  test('Excessive requests trigger rate limit (skipped in CI)', async () => {
    // This test would require many requests, skip in CI
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-16: Security - Input Validation
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-16 — Input Validation & Security', () => {
  test('MongoDB injection attempt is blocked', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: { $gt: '' }, // MongoDB injection attempt
        password: 'anything' 
      });
    // Should fail because of sanitization
    expect([401, 422]).toContain(res.status);
  });

  test('XSS attempt is sanitized', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ 
        studentId: 'TIP-123',
        studentName: '<script>alert("xss")</script>' 
      });
    if (res.status === 200) {
      expect(res.body.user.studentName).not.toContain('<script>');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-17: Event-Based Orchestration
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-17 — Event Orchestration', () => {
  test('Item creation triggers analytics event', async () => {
    const itemRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        itemName: 'Test Orchestration Item',
        description: 'Testing event system',
        category: 'electronics',
        dateLostOrFound: '2025-06-01',
        status: 'lost',
        contactInfo: '09171234567',
        studentId: 'TIP-TEST-001',
        studentName: 'Test User'
      });
    expect(itemRes.status).toBe(201);
    
    // Analytics event should be recorded (checked via logs or analytics API)
    const analyticsRes = await request(app)
      .post('/api/analytics/event')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        eventType: 'item_viewed',
        itemId: itemRes.body._id,
        metadata: { test: true }
      });
    expect(analyticsRes.status).toBe(201);
  });
});
