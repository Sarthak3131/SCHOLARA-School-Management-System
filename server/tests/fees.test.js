import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import FeeStructure from '../src/models/FeeStructure.js';
import Invoice from '../src/models/Invoice.js';
import Payment from '../src/models/Payment.js';
import { seedAllData } from '../src/utils/seed.js';

describe('SCHOLARA Fee Management API Suite', () => {
  let adminToken;
  let teacherToken;
  let guardianToken;
  let classDoc;
  let student;
  let invoice;

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
    const students = await request(app).get(`/api/students?classId=${classDoc._id}&limit=100`).set('Authorization', `Bearer ${adminToken}`);
    student = students.body.data.find((item) => item.section === 'A');
    await Payment.deleteMany({ paymentReference: /^PHASE8-/ });
    await Invoice.deleteMany({ invoiceNumber: /^PHASE8-/ });
    await FeeStructure.deleteMany({ name: 'Phase 8 Structure' });
  });

  afterAll(async () => { await mongoose.disconnect(); });

  it('creates a class fee structure and derives invoice totals on the backend', async () => {
    const structureResponse = await request(app).post('/api/fees/structures').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Phase 8 Structure', classId: classDoc._id, academicTerm: 'Term 1 (2026-2027)',
      items: [{ name: 'Tuition', amount: 700 }, { name: 'Activities', amount: 300 }],
    });
    expect(structureResponse.status).toBe(201);
    const invoiceResponse = await request(app).post('/api/fees/invoices').set('Authorization', `Bearer ${adminToken}`).send({
      studentId: student._id, feeStructureId: structureResponse.body.data._id, dueDate: '2026-12-31', invoiceNumber: 'PHASE8-INVOICE-001',
    });
    expect(invoiceResponse.status).toBe(201);
    expect(invoiceResponse.body.data.amount).toBe(1000);
    expect(invoiceResponse.body.data.outstandingAmount).toBe(1000);
    invoice = invoiceResponse.body.data;
  });

  it('supports partial payment and reconciles a full payment', async () => {
    const partial = await request(app).post(`/api/fees/invoices/${invoice._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({
      amount: 400, paymentReference: 'PHASE8-PARTIAL-001', method: 'simulated_online',
    });
    expect(partial.status).toBe(201);
    let invoices = await request(app).get('/api/fees/invoices').set('Authorization', `Bearer ${adminToken}`);
    let current = invoices.body.data.find((item) => item._id === invoice._id);
    expect(current.paidAmount).toBe(400);
    expect(current.outstandingAmount).toBe(600);
    expect(current.status).toBe('partial');
    const full = await request(app).post(`/api/fees/invoices/${invoice._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({
      amount: 600, paymentReference: 'PHASE8-FINAL-001', method: 'cash',
    });
    expect(full.status).toBe(201);
    invoices = await request(app).get('/api/fees/invoices').set('Authorization', `Bearer ${adminToken}`);
    current = invoices.body.data.find((item) => item._id === invoice._id);
    expect(current.paidAmount).toBe(1000);
    expect(current.outstandingAmount).toBe(0);
    expect(current.status).toBe('paid');
  });

  it('rejects overpayments, duplicate references, invalid amounts, and teacher access', async () => {
    const structure = await FeeStructure.findOne({ name: 'Phase 8 Structure' });
    const anotherInvoice = await request(app).post('/api/fees/invoices').set('Authorization', `Bearer ${adminToken}`).send({
      studentId: student._id, feeStructureId: structure._id, dueDate: '2026-12-31', invoiceNumber: 'PHASE8-INVOICE-002',
    });
    const overpayment = await request(app).post(`/api/fees/invoices/${anotherInvoice.body.data._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 1001, paymentReference: 'PHASE8-OVER-001' });
    expect(overpayment.status).toBe(400);
    const invalid = await request(app).post(`/api/fees/invoices/${anotherInvoice.body.data._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 0, paymentReference: 'PHASE8-INVALID-001' });
    expect(invalid.status).toBe(400);
    const invalidMethod = await request(app).post(`/api/fees/invoices/${anotherInvoice.body.data._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 10, paymentReference: 'PHASE8-INVALID-METHOD-001', method: 'cash_gateway' });
    expect(invalidMethod.status).toBe(400);
    const first = await request(app).post(`/api/fees/invoices/${anotherInvoice.body.data._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 100, paymentReference: 'PHASE8-DUPLICATE-001' });
    expect(first.status).toBe(201);
    const duplicate = await request(app).post(`/api/fees/invoices/${anotherInvoice.body.data._id}/payments`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 100, paymentReference: 'PHASE8-DUPLICATE-001' });
    expect(duplicate.status).toBe(409);
    const teacher = await request(app).get('/api/fees/invoices').set('Authorization', `Bearer ${teacherToken}`);
    expect(teacher.status).toBe(403);
  });

  it('isolates guardian invoices and exposes receipt history without mutation access', async () => {
    const invoices = await request(app).get('/api/fees/invoices').set('Authorization', `Bearer ${guardianToken}`);
    expect(invoices.status).toBe(200);
    expect(invoices.body.data.every((item) => item.student)).toBe(true);
    const history = await request(app).get(`/api/fees/invoices/${invoice._id}/payments`).set('Authorization', `Bearer ${guardianToken}`);
    expect(history.status).toBe(200);
    const receipt = await request(app).get(`/api/fees/payments/${history.body.data.payments[0]._id}/receipt`).set('Authorization', `Bearer ${guardianToken}`);
    expect(receipt.status).toBe(200);
    const mutation = await request(app).post(`/api/fees/invoices/${invoice._id}/payments`).set('Authorization', `Bearer ${guardianToken}`).send({ amount: 1, paymentReference: 'PHASE8-GUARDIAN-001' });
    expect(mutation.status).toBe(403);
  });

  it('rejects invalid invoice filters', async () => {
    const response = await request(app).get('/api/fees/invoices?status=unknown').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(400);
  });
});
