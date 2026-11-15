import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import AuditLog from '../src/models/AuditLog.js';
import { seedAllData } from '../src/utils/seed.js';

describe('Phase 10 reports and audit access', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    await seedAllData();
    const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;
    adminToken = await login('admin@scholara.edu', 'Admin@123');
    teacherToken = await login('teacher@scholara.edu', 'Teacher@123');
    guardianToken = await login('guardian@scholara.edu', 'Guardian@123');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('returns data-backed reports to administrators', async () => {
    const [students, attendance, examinations, fees] = await Promise.all([
      request(app).get('/api/reports/students').set('Authorization', 'Bearer ' + adminToken),
      request(app).get('/api/reports/attendance').set('Authorization', 'Bearer ' + adminToken),
      request(app).get('/api/reports/examinations').set('Authorization', 'Bearer ' + adminToken),
      request(app).get('/api/reports/fees').set('Authorization', 'Bearer ' + adminToken),
    ]);
    expect(students.status).toBe(200);
    expect(students.body.data.summary.totalStudents).toBeGreaterThan(0);
    expect(attendance.status).toBe(200);
    expect(attendance.body.data.summary.total).toBeGreaterThanOrEqual(0);
    expect(examinations.status).toBe(200);
    expect(fees.status).toBe(200);
    expect(fees.body.data.summary.totalInvoiced).toBeGreaterThanOrEqual(fees.body.data.summary.totalCollected);
  });

  it('supports audit metadata, filters and pagination', async () => {
    const created = await AuditLog.create({
      userName: 'Phase 10 Admin',
      userRole: 'admin',
      action: 'CLASS_UPDATED',
      details: 'Updated report test class',
      entityId: new mongoose.Types.ObjectId(),
      entityType: 'Class',
    });
    expect(created.module).toBe('class');
    const response = await request(app).get('/api/audit').query({ module: 'class', search: 'report test', limit: 1 }).set('Authorization', 'Bearer ' + adminToken);
    expect(response.status).toBe(200);
    expect(response.body.data.logs).toHaveLength(1);
    expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('denies audit and report access to non-administrators', async () => {
    const [teacherAudit, guardianReports] = await Promise.all([
      request(app).get('/api/audit').set('Authorization', 'Bearer ' + teacherToken),
      request(app).get('/api/reports/students').set('Authorization', 'Bearer ' + guardianToken),
    ]);
    expect(teacherAudit.status).toBe(403);
    expect(guardianReports.status).toBe(403);
  });

  it('validates report filters and protects audit details', async () => {
    const invalid = await request(app).get('/api/reports/attendance').query({ from: 'not-a-date' }).set('Authorization', 'Bearer ' + adminToken);
    expect(invalid.status).toBe(400);
    const missing = await request(app).get(`/api/audit/${new mongoose.Types.ObjectId()}`).set('Authorization', 'Bearer ' + adminToken);
    expect(missing.status).toBe(404);
  });
});
