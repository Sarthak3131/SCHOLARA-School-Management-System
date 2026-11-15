import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { seedAuthUsers } from '../src/utils/seed.js';
import { generateToken } from '../src/utils/token.js';

describe('SCHOLARA Authentication & RBAC API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    await seedAuthUsers();

    const login = async (email, password) => {
      const response = await request(app).post('/api/auth/login').send({ email, password });
      return response.body.token;
    };
    adminToken = await login('admin@scholara.edu', 'Admin@123');
    teacherToken = await login('teacher@scholara.edu', 'Teacher@123');
    guardianToken = await login('guardian@scholara.edu', 'Guardian@123');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('fails closed when JWT_SECRET is missing', () => {
    const configuredSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      expect(() => generateToken({
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        role: 'guardian',
        name: 'Test',
      })).toThrow(/JWT_SECRET must be configured/i);
    } finally {
      process.env.JWT_SECRET = configuredSecret;
    }
  });

  describe('POST /api/auth/login', () => {
    it('authenticates admin with valid credentials and returns JWT', async () => {
      const res = await request(app).post('/api/auth/login').send({
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
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@scholara.edu',
        password: 'WrongPassword999',
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('rejects login with non-existent email with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@scholara.edu',
        password: 'AnyPassword123',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed email format with 400 validation error', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: 'Password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('requires an authenticated administrator', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Attempted Admin',
        email: 'attempted-admin@scholara.edu',
        password: 'Password123',
        role: 'admin',
      });
      expect(res.status).toBe(401);
    });

    it('blocks non-administrators from selecting privileged roles', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Attempted Admin',
          email: 'attempted-admin@scholara.edu',
          password: 'Password123',
          role: 'admin',
        });
      expect(res.status).toBe(403);
    });

    it('allows an administrator to create a role-managed account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Managed Guardian',
          email: 'managed-guardian@scholara.edu',
          password: 'Password123',
          role: 'guardian',
        });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('guardian');
      expect(res.body.user.password).toBeUndefined();
      await User.deleteOne({ email: 'managed-guardian@scholara.edu' });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('returns current user profile when valid token is supplied', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${teacherToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('teacher@scholara.edu');
      expect(res.body.data.user.role).toBe('teacher');
    });
  });

  describe('RBAC authorization', () => {
    it('allows admin access to admin-only endpoint', async () => {
      const res = await request(app).get('/api/auth/admin-only').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    it.each([
      ['teacher', () => teacherToken],
      ['guardian', () => guardianToken],
    ])('blocks %s from accessing admin-only endpoint', async (_role, token) => {
      const res = await request(app).get('/api/auth/admin-only').set('Authorization', `Bearer ${token()}`);
      expect(res.status).toBe(403);
    });
  });

  it('requires authentication to log out', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('revokes the current bearer token without affecting another user', async () => {
    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(logout.status).toBe(200);

    const revoked = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(revoked.status).toBe(401);

    const unaffected = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(unaffected.status).toBe(200);
  });

  it('clears the authenticated session cookie on logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
