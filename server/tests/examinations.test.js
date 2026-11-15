import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Examination from '../src/models/Examination.js';
import Result from '../src/models/Result.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Examination and Results API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;
  let exam;
  let classDoc;
  let subject;
  let student;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scholara';
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    await seedAllData();
    const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;
    adminToken = await login('admin@scholara.edu', 'Admin@123');
    teacherToken = await login('teacher@scholara.edu', 'Teacher@123');
    guardianToken = await login('guardian@scholara.edu', 'Guardian@123');
    const classes = await request(app).get('/api/academics/classes').set('Authorization', `Bearer ${adminToken}`);
    classDoc = classes.body.data.find((item) => item.code === 'GR10');
    const subjects = await request(app).get('/api/academics/subjects').set('Authorization', `Bearer ${adminToken}`);
    subject = subjects.body.data.find((item) => item.name === 'Mathematics');
    const students = await request(app).get(`/api/students?classId=${classDoc._id}`).set('Authorization', `Bearer ${adminToken}`);
    student = students.body.data.find((item) => item.section === 'A') || students.body.data[0];
    await Examination.deleteMany({ name: 'Phase 7 Verification Examination' });
  });

  afterAll(async () => { await mongoose.disconnect(); });

  it('creates an examination with configurable grading rules', async () => {
    const response = await request(app).post('/api/examinations').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Phase 7 Verification Examination', type: 'midterm', classId: classDoc._id,
      sections: ['A'], subjects: [{ subject: subject._id, maxMarks: 100 }],
      scheduledDate: '2026-12-01', academicYear: '2024-2025',
      gradingRules: [{ minPercentage: 50, maxPercentage: 100, grade: 'PASS', remark: 'Pass' }, { minPercentage: 0, maxPercentage: 49.99, grade: 'FAIL', remark: 'Fail' }],
    });
    expect(response.status).toBe(201);
    exam = response.body.data;
  });

  it('blocks a teacher from an unassigned subject', async () => {
    const subjects = await request(app).get('/api/academics/subjects').set('Authorization', `Bearer ${adminToken}`);
    const otherSubject = subjects.body.data.find((item) => item._id !== subject._id);
    await Examination.findByIdAndUpdate(exam._id, { subjects: [{ subject: otherSubject._id, maxMarks: 50 }] });
    const response = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${teacherToken}`).send({
      examinationId: exam._id, subjectId: otherSubject._id, results: [{ student: student._id, marks: 40 }],
    });
    expect(response.status).toBe(403);
    await Examination.findByIdAndUpdate(exam._id, { subjects: [{ subject: subject._id, maxMarks: 100 }] });
  });

  it('calculates grades server-side and prevents invalid marks', async () => {
    const response = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${adminToken}`).send({
      examinationId: exam._id, subjectId: subject._id, results: [{ student: student._id, marks: 80 }],
    });
    expect(response.status).toBe(201);
    expect(response.body.data[0].percentage).toBe(80);
    expect(response.body.data[0].grade).toBe('PASS');
    const invalid = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${adminToken}`).send({
      examinationId: exam._id, subjectId: subject._id, results: [{ student: student._id, marks: 101 }],
    });
    expect(invalid.status).toBe(400);
  });

  it('prevents duplicate student examination subject results at API and database levels', async () => {
    const duplicate = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${adminToken}`).send({
      examinationId: exam._id, subjectId: subject._id, results: [{ student: student._id, marks: 70 }],
    });
    expect(duplicate.status).toBe(409);
    const indexes = await Result.collection.indexes();
    expect(indexes.some((index) => index.unique && index.key.examination && index.key.student && index.key.subject)).toBe(true);
  });

  it('keeps guardian results scoped to linked students and read-only', async () => {
    const response = await request(app).get(`/api/examinations/results?examinationId=${exam._id}`).set('Authorization', `Bearer ${guardianToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.every((item) => item.student)).toBe(true);
    const mutation = await request(app).post('/api/examinations/results').set('Authorization', `Bearer ${guardianToken}`).send({});
    expect(mutation.status).toBe(403);
  });
});
