/**
 * Integration Tests — Lost & Found @ TIP Manila
 * Tests all API endpoints: Auth, Items, Middleware, RBAC
 *
 * Run: npm test
 * Requires: MONGO_URI and JWT_SECRET in .env (or test environment)
 */

import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

// ── Dynamic import of app after env is loaded ─────────────────────────────────
let app;
let adminToken;
let userToken;
let createdItemId;

const TEST_ADMIN = {
  username: 'testadmin_' + Date.now(),
  email: `admin_${Date.now()}@tip.edu.ph`,
  password: 'Admin@12345'
};
const TEST_USER = {
  username: 'testuser_' + Date.now(),
  email: `user_${Date.now()}@tip.edu.ph`,
  password: 'User@12345'
};

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_ci';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound';

  const serverModule = await import('../server.js');
  app = serverModule.default;

  // Wait for DB connection
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('connected', resolve);
  });
}, 30000);

afterAll(async () => {
  // Clean up test data
  try {
    const User = (await import('../models/userModel.js')).default;
    const Item = (await import('../models/itemModel.js')).default;
    await User.deleteMany({ email: { $in: [TEST_ADMIN.email, TEST_USER.email] } });
    if (createdItemId) await Item.findByIdAndDelete(createdItemId);
  } catch (_) {}
  await mongoose.connection.close();
}, 15000);

// ═══════════════════════════════════════════════════════════════════════════════
// TC-01: Health Check
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-01 — Health Check', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('mongodb');
    expect(res.body).toHaveProperty('uptime');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-02: Auth — Register
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-02 — POST /api/auth/register', () => {
  test('Registers a new user and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_USER.email);
    userToken = res.body.token;
  });

  test('Returns 422 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bad', email: 'not-an-email', password: '123456' });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('Returns 422 for password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'shortpw', email: 'short@tip.edu.ph', password: '123' });
    expect(res.status).toBe(422);
  });

  test('Returns 400 on duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-03: Auth — Login
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-03 — POST /api/auth/login', () => {
  test('Logs in with correct credentials and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token; // refresh token
  });

  test('Returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('Returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@tip.edu.ph', password: 'whatever123' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-04: Auth — Get Current User
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-04 — GET /api/auth/me', () => {
  test('Returns current user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_USER.email);
    expect(res.body).not.toHaveProperty('password');
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('Returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-05: Items — GET all
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-05 — GET /api/items', () => {
  test('Returns array of items (public endpoint)', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Supports ?status=lost filter', async () => {
    const res = await request(app).get('/api/items?status=lost');
    expect(res.status).toBe(200);
    res.body.forEach(item => expect(item.status).toBe('lost'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-06: Items — POST (create item)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-06 — POST /api/items', () => {
  const validItem = {
    itemName: 'Blue Umbrella',
    description: 'A blue folding umbrella left in the cafeteria',
    category: 'accessories',
    dateLostOrFound: '2025-06-01',
    status: 'found',
    contactInfo: '09171234567',
    studentId: 'TIP-2023-001',
    studentName: 'Juan Dela Cruz'
  };

  test('Creates item with valid data and JWT', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validItem);
    expect(res.status).toBe(201);
    expect(res.body.itemName).toBe('Blue Umbrella');
    createdItemId = res.body._id;
  });

  test('Returns 401 without token', async () => {
    const res = await request(app).post('/api/items').send(validItem);
    expect(res.status).toBe(401);
  });

  test('Returns 422 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ itemName: 'No other fields' });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('Returns 422 for invalid category', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validItem, category: 'weapons' });
    expect(res.status).toBe(422);
  });

  test('Returns 422 for invalid studentId format', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validItem, studentId: 'a' });
    expect(res.status).toBe(422);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-07: Items — PATCH (update status)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-07 — PATCH /api/items/:id', () => {
  test('Updates item status with valid token', async () => {
    if (!createdItemId) return; // skip if item creation failed
    const res = await request(app)
      .patch(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'claimed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('claimed');
  });

  test('Returns 401 without token', async () => {
    if (!createdItemId) return;
    const res = await request(app)
      .patch(`/api/items/${createdItemId}`)
      .send({ status: 'claimed' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-08: RBAC — DELETE requires admin
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-08 — DELETE /api/items/:id (RBAC)', () => {
  test('Returns 403 when non-admin user attempts delete', async () => {
    if (!createdItemId) return;
    const res = await request(app)
      .delete(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  test('Admin can delete item (admin user setup)', async () => {
    // Register admin directly via DB manipulation
    const User = (await import('../models/userModel.js')).default;
    const adminUser = new User({ ...TEST_ADMIN, role: 'admin' });
    await adminUser.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;

    if (!createdItemId) return;
    const res = await request(app)
      .delete(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
    createdItemId = null; // mark as deleted
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-09: Student Verify endpoint
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-09 — POST /api/auth/verify', () => {
  test('Returns success for valid student ID and name', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ studentId: 'TIP-2023-001', studentName: 'Juan Dela Cruz' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ studentId: 'TIP-2023-001' });
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-10: Monitoring logs endpoint
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-10 — GET /api/monitor/logs', () => {
  test('Returns recent request logs array', async () => {
    const res = await request(app).get('/api/monitor/logs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });
});
