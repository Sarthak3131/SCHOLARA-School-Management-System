import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Admin Dashboard API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await seedAllData();

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@scholara.edu', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // Login Teacher
    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@scholara.edu', password: 'Teacher@123' });
    teacherToken = teacherRes.body.token;

    // Login Guardian
    const guardianRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guardian@scholara.edu', password: 'Guardian@123' });
    guardianToken = guardianRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /api/dashboard/admin — Access Control', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/dashboard/admin');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks teacher from accessing admin dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('blocks guardian from accessing admin dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${guardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  describe('GET /api/dashboard/admin — Metrics & Aggregations', () => {
    it('returns 200 with comprehensive institutional metrics for administrator', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toBeDefined();

      // Summary counts
      expect(data.summary).toBeDefined();
      expect(data.summary.totalStudents).toBeGreaterThan(0);
      expect(data.summary.totalTeachers).toBeGreaterThan(0);
      expect(data.summary.totalClasses).toBeGreaterThan(0);

      // Attendance metrics
      expect(data.attendance).toBeDefined();
      expect(data.attendance.today).toBeDefined();
      expect(typeof data.attendance.today.rate).toBe('number');
      expect(Array.isArray(data.attendance.trend)).toBe(true);
      expect(data.attendance.trend.length).toBeGreaterThan(0);

      // Financial statistics
      expect(data.financial).toBeDefined();
      expect(data.financial.totalInvoiced).toBeGreaterThan(0);
      expect(data.financial.totalCollected).toBeGreaterThan(0);
      expect(data.financial.totalOutstanding).toBeGreaterThanOrEqual(0);
      expect(typeof data.financial.collectionRate).toBe('number');
      expect(Array.isArray(data.financial.monthlyTrend)).toBe(true);

      // Academic performance overview
      expect(data.academic).toBeDefined();
      expect(Array.isArray(data.academic.gradeDistribution)).toBe(true);
      expect(data.academic.gradeDistribution.length).toBeGreaterThan(0);

      // Class overview
      expect(Array.isArray(data.classOverview)).toBe(true);
      expect(data.classOverview.length).toBeGreaterThan(0);

      // Recent institutional audit activities
      expect(Array.isArray(data.recentActivities)).toBe(true);
      expect(data.recentActivities.length).toBeGreaterThan(0);
      expect(data.recentActivities[0].action).toBeDefined();

      // Recent invoices
      expect(Array.isArray(data.recentInvoices)).toBe(true);
      expect(data.recentInvoices.length).toBeGreaterThan(0);
    });
  });
});
