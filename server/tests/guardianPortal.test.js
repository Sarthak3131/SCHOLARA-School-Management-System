import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Student from '../src/models/Student.js';
import Class from '../src/models/Class.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Unified Guardian Portal Privacy Suite', () => {
  let guardianToken;
  let adminToken;
  let linkedStudents;
  let unrelatedStudent;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    await seedAllData();
    const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;
    guardianToken = await login('guardian@scholara.edu', 'Guardian@123');
    adminToken = await login('admin@scholara.edu', 'Admin@123');
    const linked = await request(app).get('/api/students/linked').set('Authorization', `Bearer ${guardianToken}`);
    linkedStudents = linked.body.data;
    const classDoc = await Class.findOne({ code: 'GR09' });
    unrelatedStudent = await Student.create({
      name: 'Unrelated Portal Student',
      admissionNumber: 'PORTAL-UNRELATED-001',
      class: classDoc._id,
      section: classDoc.sections[0].name,
      guardian: null,
    });
  });

  afterAll(async () => {
    await Student.deleteOne({ _id: unrelatedStudent._id });
    await mongoose.disconnect();
  });

  it('returns all linked students for a guardian without exposing unrelated records', async () => {
    expect(linkedStudents.length).toBeGreaterThan(1);
    expect(linkedStudents.every((student) => student.name !== unrelatedStudent.name)).toBe(true);
    expect(linkedStudents.every((student) => !student.guardian && student.admissionNumber)).toBe(true);
  });

  it('allows a linked student profile and rejects an unrelated profile', async () => {
    const linkedProfile = await request(app)
      .get(`/api/students/${linkedStudents[0]._id}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(linkedProfile.status).toBe(200);
    const unrelatedProfile = await request(app)
      .get(`/api/students/${unrelatedStudent._id}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(unrelatedProfile.status).toBe(403);
  });

  it('scopes attendance, results, invoices, and payment routes to linked students', async () => {
    const attendance = await request(app).get(`/api/attendance?studentId=${unrelatedStudent._id}`).set('Authorization', `Bearer ${guardianToken}`);
    expect(attendance.status).toBe(403);
    const results = await request(app).get(`/api/examinations/results?studentId=${unrelatedStudent._id}`).set('Authorization', `Bearer ${guardianToken}`);
    expect(results.status).toBe(403);
    const reportCard = await request(app).get(`/api/examinations/report-card/${unrelatedStudent._id}`).set('Authorization', `Bearer ${guardianToken}`);
    expect(reportCard.status).toBe(403);
    const invoices = await request(app).get(`/api/fees/invoices?studentId=${unrelatedStudent._id}`).set('Authorization', `Bearer ${guardianToken}`);
    expect(invoices.status).toBe(403);
  });

  it('keeps guardian portal read-only and denies admin operations', async () => {
    const feeStructure = await request(app).post('/api/fees/structures').set('Authorization', `Bearer ${guardianToken}`).send({});
    expect(feeStructure.status).toBe(403);
    const attendanceMutation = await request(app).post('/api/attendance').set('Authorization', `Bearer ${guardianToken}`).send({});
    expect(attendanceMutation.status).toBe(403);
    const resultMutation = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${guardianToken}`).send({});
    expect(resultMutation.status).toBe(403);
    const adminOnlyLinked = await request(app).get('/api/students/linked').set('Authorization', `Bearer ${adminToken}`);
    expect(adminOnlyLinked.status).toBe(403);
  });
});
