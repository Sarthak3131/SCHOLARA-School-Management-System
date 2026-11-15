import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Attendance from '../src/models/Attendance.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Attendance Management API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;
  let assignedClass;
  let assignedSection;
  let roster;
  let submittedRecord;
  const attendanceDate = '2026-11-15';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    await seedAllData();

    const login = async (email, password) => {
      const response = await request(app).post('/api/auth/login').send({ email, password });
      return response.body.token;
    };
    adminToken = await login('admin@scholara.edu', 'Admin@123');
    teacherToken = await login('teacher@scholara.edu', 'Teacher@123');
    guardianToken = await login('guardian@scholara.edu', 'Guardian@123');

    const options = await request(app)
      .get('/api/attendance/options')
      .set('Authorization', `Bearer ${teacherToken}`);
    assignedClass = options.body.data.classes.find((item) => item.code === 'GR10');
    assignedSection = 'A';
    await Attendance.deleteMany({ date: new Date(`${attendanceDate}T00:00:00.000Z`) });

    const rosterResponse = await request(app)
      .get(`/api/attendance/roster?classId=${assignedClass._id}&section=${assignedSection}&date=${attendanceDate}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    roster = rosterResponse.body.data;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('submits attendance and returns calculated records', async () => {
    const response = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: attendanceDate,
        classId: assignedClass._id,
        section: assignedSection,
        session: 'daily',
        records: roster.slice(0, 3).map((student, index) => ({
          student: student._id,
          status: index === 1 ? 'late' : 'present',
        })),
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveLength(3);
    submittedRecord = response.body.data[0];
  });

  it('prevents duplicate attendance submissions', async () => {
    const response = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: attendanceDate,
        classId: assignedClass._id,
        section: assignedSection,
        records: [{ student: roster[0]._id, status: 'absent' }],
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it('rejects invalid status values', async () => {
    const response = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: attendanceDate,
        classId: assignedClass._id,
        section: assignedSection,
        records: [{ student: roster[0]._id, status: 'holiday' }],
      });

    expect(response.status).toBe(400);
  });

  it('blocks teachers from unassigned classes', async () => {
    const classes = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${adminToken}`);
    const unassigned = classes.body.data.find((item) => item.code === 'GR09');

    const response = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: attendanceDate,
        classId: unassigned._id,
        section: unassigned.sections[0].name,
        records: [{ student: roster[0]._id, status: 'present' }],
      });

    expect(response.status).toBe(403);
  });

  it('allows an assigned teacher to update attendance', async () => {
    const response = await request(app)
      .put(`/api/attendance/${submittedRecord._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'absent' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('absent');
  });

  it('scopes guardian history and prevents guardian mutations', async () => {
    const history = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(history.status).toBe(200);
    expect(history.body.data.records.every((record) => record.student)).toBe(true);

    const mutation = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ date: '2026-11-16', classId: assignedClass._id, section: 'A', records: [] });
    expect(mutation.status).toBe(403);
  });

  it('calculates attendance statistics correctly', async () => {
    const response = await request(app)
      .get('/api/attendance?date=' + attendanceDate + '&classId=' + assignedClass._id + '&section=A')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats.total).toBe(3);
    expect(response.body.data.stats.present).toBe(1);
    expect(response.body.data.stats.absent).toBe(1);
    expect(response.body.data.stats.late).toBe(1);
    expect(response.body.data.stats.attendanceRate).toBe(33.3);
  });

  it('retains the compound uniqueness guarantee at the model level', async () => {
    const indexes = await Attendance.collection.indexes();
    expect(indexes.some((index) => index.unique && index.key.student && index.key.date && index.key.session)).toBe(true);
  });
});
