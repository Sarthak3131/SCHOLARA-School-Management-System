import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Academic & User Management API Suite', () => {
  let adminToken;
  let teacherToken;
  let testClassId;
  let testStudentId;
  let testTeacherId;

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

    // Get a Class ID for testing
    const classesRes = await request(app)
      .get('/api/academics/classes')
      .set('Authorization', `Bearer ${adminToken}`);
    testClassId = classesRes.body.data[0]._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ── Students Management ──────────────────────────────────────────────────────
  describe('Students API (/api/students)', () => {
    it('creates a new student with auto-generated admission number', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Genevieve Delacour',
          classId: testClassId,
          section: 'A',
          gender: 'female',
          email: 'genevieve@example.com',
          phone: '+91 99887 76655',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Genevieve Delacour');
      expect(res.body.data.admissionNumber).toBeDefined();
      testStudentId = res.body.data._id;
    });

    it('rejects an invalid guardian link', async () => {
      const res = await request(app)
        .put(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ guardian: '000000000000000000000000' });

      expect(res.status).toBe(400);
    });

    it('retrieves paginated students list with search and filters', async () => {
      const res = await request(app)
        .get('/api/students?search=Genevieve&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('retrieves detailed student profile with attendance telemetry', async () => {
      const res = await request(app)
        .get(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student._id).toBe(testStudentId);
      expect(res.body.data.attendanceTelemetry).toBeDefined();
      expect(Array.isArray(res.body.data.invoices)).toBe(true);
    });

    it('updates student information successfully', async () => {
      const res = await request(app)
        .put(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Genevieve Delacour-Wright',
          rollNumber: '10A-99',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Genevieve Delacour-Wright');
      expect(res.body.data.rollNumber).toBe('10A-99');
    });

    it('soft deactivates student record', async () => {
      const res = await request(app)
        .delete(`/api/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── Teachers Management ──────────────────────────────────────────────────────
  describe('Teachers API (/api/teachers)', () => {
    it('registers a new faculty teacher with auto-assigned employee ID', async () => {
      const uniqueEmail = `dr.watson.${Date.now()}@scholara.edu`;
      const res = await request(app)
        .post('/api/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. John Watson',
          email: uniqueEmail,
          password: 'Teacher@123',
          specialization: 'Biochemical Sciences',
          qualification: 'M.D., Ph.D.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeId).toBeDefined();
      expect(res.body.data.specialization).toBe('Biochemical Sciences');
      testTeacherId = res.body.data._id;
    });

    it('retrieves paginated teachers list for administrator', async () => {
      const res = await request(app)
        .get('/api/teachers?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('assigns class sections and subject workload to faculty educator', async () => {
      const res = await request(app)
        .patch(`/api/teachers/${testTeacherId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assignedClasses: [
            { class: testClassId, section: 'A', subject: 'Natural Sciences' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedClasses.length).toBe(1);
    });

    it('updates and deactivates a faculty educator', async () => {
      const update = await request(app)
        .put(`/api/teachers/${testTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dr. John Watson Updated', specialization: 'Clinical Sciences', qualification: 'M.D.' });
      expect(update.status).toBe(200);
      expect(update.body.data.user.name).toBe('Dr. John Watson Updated');

      const deactivated = await request(app)
        .delete(`/api/teachers/${testTeacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(deactivated.status).toBe(200);
    });

    it('rejects invalid faculty registration input', async () => {
      const res = await request(app)
        .post('/api/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', email: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── Academic Infrastructure (Classes & Subjects) ──────────────────────────────
  describe('Academic Infrastructure API (/api/academics)', () => {
    it('lists all classes with section capacities and pupil counts', async () => {
      const res = await request(app)
        .get('/api/academics/classes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].studentCount).toBeDefined();
    });

    it('creates a new academic class with sections', async () => {
      const res = await request(app)
        .post('/api/academics/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grade 8 Preparatory',
          code: `GR08-${Date.now()}`,
          sections: [{ name: 'A', capacity: 30 }, { name: 'B', capacity: 30 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Grade 8 Preparatory');
    });

    it('updates class sections and rejects empty class names', async () => {
      const update = await request(app)
        .put(`/api/academics/classes/${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grade 10 Updated', sections: [{ name: 'A', capacity: 40 }] });
      expect(update.status).toBe(200);
      expect(update.body.data.sections[0].capacity).toBe(40);

      const invalid = await request(app)
        .put(`/api/academics/classes/${testClassId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(invalid.status).toBe(400);
    });

    it('lists academic subjects with credits and weekly periods', async () => {
      const res = await request(app)
        .get('/api/academics/subjects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('creates a new curriculum subject', async () => {
      const res = await request(app)
        .post('/api/academics/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Robotics & Automation',
          code: `ROB-${Date.now()}`,
          department: 'Applied Sciences',
          weeklyPeriods: 4,
          credits: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Robotics & Automation');
    });

    it('updates a subject and enforces admin authorization', async () => {
      const subjects = await request(app)
        .get('/api/academics/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
      const subjectId = subjects.body.data[0]._id;
      const update = await request(app)
        .put(`/api/academics/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ weeklyPeriods: 6, credits: 5 });
      expect(update.status).toBe(200);

      const forbidden = await request(app)
        .put(`/api/academics/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Unauthorized Update' });
      expect(forbidden.status).toBe(403);
    });

    it('fetches registered guardians for student assignment', async () => {
      const res = await request(app)
        .get('/api/academics/guardians')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('restricts guardian management records to administrators', async () => {
      const forbidden = await request(app)
        .get('/api/academics/guardians/management')
        .set('Authorization', `Bearer ${teacherToken}`)
      expect(forbidden.status).toBe(403);

      const allowed = await request(app)
        .get('/api/academics/guardians/management')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(allowed.status).toBe(200);
      expect(allowed.body.data[0].linkedStudents).toBeDefined();
    });
  });
});
