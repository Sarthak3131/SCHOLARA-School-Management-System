import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { seedAuthUsers } from '../src/utils/seed.js';

describe('SCHOLARA Authentication & RBAC API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Seed users
    await seedAuthUsers();

    // Acquire tokens for test roles
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@scholara.edu', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@scholara.edu', password: 'Teacher@123' });
    teacherToken = teacherRes.body.token;

    const guardianRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guardian@scholara.edu', password: 'Guardian@123' });
    guardianToken = guardianRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('authenticates admin with valid credentials and returns JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@scholara.edu',
          password: 'Admin@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('admin@scholara.edu');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects login with incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@scholara.edu',
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('rejects login with non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@scholara.edu',
          password: 'AnyPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed email format with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    it('returns 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when token is invalid or corrupted', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns current user profile when valid token is supplied', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('teacher@scholara.edu');
      expect(res.body.data.user.role).toBe('teacher');
    });
  });

  describe('RBAC Authorization', () => {
    it('allows admin access to admin-only endpoint', async () => {
      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('admin');
    });

    it('blocks teacher from accessing admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('blocks guardian from accessing admin-only endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${guardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session and returns 200', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
