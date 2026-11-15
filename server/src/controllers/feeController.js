import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${label}.`, 400);
  return new mongoose.Types.ObjectId(value);
};

const amount = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new AppError(`${label} must be greater than zero.`, 400);
  return Number(parsed.toFixed(2));
};

const statusFor = (total, paid, dueDate) => {
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return new Date(dueDate) < new Date() ? 'overdue' : 'pending';
};

const scopedStudentIds = async (req) => {
  if (req.user.role !== 'guardian') return null;
  const students = await Student.find({ guardian: req.user._id }).select('_id').lean();
  return students.map((student) => student._id);
};

const ensureInvoiceAccess = async (req, invoice) => {
  if (!invoice) throw new AppError('Invoice not found.', 404);
  if (req.user.role === 'guardian' && invoice.student.guardian?.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden: Invoice is not linked to this guardian.', 403);
  }
};

export const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find({ isActive: true }).populate('class', 'name code').sort({ createdAt: -1 }).lean();
    sendSuccess(res, structures, 'Fee structures retrieved successfully');
  } catch (error) { next(error); }
};

export const createFeeStructure = async (req, res, next) => {
  try {
    const { name, classId, academicTerm, items } = req.body;
    const classDoc = await Class.findById(objectId(classId, 'class')).lean();
    if (!name?.trim() || !academicTerm?.trim() || !classDoc || !Array.isArray(items) || !items.length) return next(new AppError('Name, class, term, and fee items are required.', 400));
    const normalizedItems = items.map((item) => ({ name: item.name?.trim(), amount: amount(item.amount, 'Fee item amount') }));
    if (normalizedItems.some((item) => !item.name)) return next(new AppError('Every fee item needs a name.', 400));
    const structure = await FeeStructure.create({ name, class: classDoc._id, academicTerm, items: normalizedItems, createdBy: req.user._id });
    sendSuccess(res, structure, 'Fee structure created successfully', 201);
  } catch (error) { next(error); }
};

export const updateFeeStructure = async (req, res, next) => {
  try {
    const structure = await FeeStructure.findById(req.params.id);
    if (!structure) return next(new AppError('Fee structure not found.', 404));
    if (req.body.name !== undefined) structure.name = req.body.name.trim();
    if (req.body.academicTerm !== undefined) structure.academicTerm = req.body.academicTerm.trim();
    if (req.body.items !== undefined) structure.items = req.body.items.map((item) => ({ name: item.name?.trim(), amount: amount(item.amount, 'Fee item amount') }));
    if (req.body.isActive !== undefined) structure.isActive = Boolean(req.body.isActive);
    await structure.save();
    sendSuccess(res, structure, 'Fee structure updated successfully');
  } catch (error) { next(error); }
};

export const getInvoices = async (req, res, next) => {
  try {
    const query = {};
    const linked = await scopedStudentIds(req);
    if (linked) query.student = { $in: linked };
    if (req.query.studentId) {
      const requestedStudent = objectId(req.query.studentId, 'student');
      if (linked && !linked.some((studentId) => studentId.toString() === requestedStudent.toString())) return next(new AppError('Forbidden: Student is not linked to this guardian.', 403));
      query.student = requestedStudent;
    }
    if (req.query.classId) query.class = objectId(req.query.classId, 'class');
    if (req.query.status) {
      if (!['paid', 'partial', 'pending', 'overdue'].includes(req.query.status)) return next(new AppError('Invalid invoice status.', 400));
      query.status = req.query.status;
    }
    if (req.query.from || req.query.to) query.createdAt = {};
    if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) query.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    const invoices = await Invoice.find(query).populate('student', 'name admissionNumber class section guardian').populate('class', 'name code').sort({ createdAt: -1 }).lean();
    sendSuccess(res, invoices.map((invoice) => {
      const outstandingAmount = Math.max(0, Number((invoice.amount - invoice.paidAmount).toFixed(2)));
      return { ...invoice, outstandingAmount, status: statusFor(invoice.amount, invoice.paidAmount, invoice.dueDate) };
    }), 'Invoices retrieved successfully');
  } catch (error) { next(error); }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { studentId, feeStructureId, dueDate, invoiceNumber } = req.body;
    const student = await Student.findById(objectId(studentId, 'student')).lean();
    const structure = await FeeStructure.findOne({ _id: objectId(feeStructureId, 'fee structure'), isActive: true }).lean();
    if (!student || !structure) return next(new AppError('Student or active fee structure not found.', 404));
    if (student.class.toString() !== structure.class.toString()) return next(new AppError('Fee structure does not apply to this student class.', 400));
    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) return next(new AppError('A valid due date is required.', 400));
    const total = Number(structure.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNumber?.trim() || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      student: student._id, class: student.class, feeStructure: structure._id, title: structure.name,
      amount: total, paidAmount: 0, outstandingAmount: total, dueDate, academicTerm: structure.academicTerm,
    });
    await AuditLog.create({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'FEE_INVOICE_GENERATED', details: `Generated ${invoice.invoiceNumber}`, ipAddress: req.ip || '127.0.0.1' });
    sendSuccess(res, invoice, 'Invoice generated successfully', 201);
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Invoice number already exists.', 409));
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('student', 'name admissionNumber guardian').lean();
    await ensureInvoiceAccess(req, invoice);
    const payments = await Payment.find({ invoice: invoice._id }).populate('recordedBy', 'name role').sort({ createdAt: -1 }).lean();
    sendSuccess(res, { invoice: { ...invoice, outstandingAmount: Math.max(0, invoice.amount - invoice.paidAmount) }, payments }, 'Payment history retrieved successfully');
  } catch (error) { next(error); }
};

export const recordPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;
  try {
    const invoiceId = objectId(req.params.id, 'invoice');
    const paymentAmount = amount(req.body.amount, 'Payment amount');
    const paymentReference = req.body.paymentReference?.trim();
    if (!paymentReference) return next(new AppError('Payment reference is required.', 400));
    if (req.body.method && !['cash', 'bank_transfer', 'simulated_online'].includes(req.body.method)) return next(new AppError('Invalid payment method.', 400));
    const existing = await Payment.findOne({ paymentReference }).lean();
    if (existing) return next(new AppError('This payment reference has already been processed.', 409));
    const invoice = await Invoice.findById(invoiceId).lean();
    if (!invoice) return next(new AppError('Invoice not found.', 404));
    const outstanding = Number((invoice.amount - invoice.paidAmount).toFixed(2));
    if (paymentAmount > outstanding) return next(new AppError(`Payment exceeds outstanding balance of ${outstanding.toFixed(2)}.`, 400));
    let payment;
    try {
      session.startTransaction();
      transactionStarted = true;
      [payment] = await Payment.create([{ paymentReference, invoice: invoice._id, student: invoice.student, amount: paymentAmount, method: req.body.method || 'simulated_online', notes: req.body.notes || '', recordedBy: req.user._id }], { session });
      const updated = await Invoice.findOneAndUpdate(
        { _id: invoice._id, $expr: { $lte: [{ $add: ['$paidAmount', paymentAmount] }, '$amount'] } },
        { $inc: { paidAmount: paymentAmount } },
        { new: true, session }
      );
      if (!updated) throw new AppError('Invoice balance changed; payment was not processed.', 409);
      updated.outstandingAmount = Number((updated.amount - updated.paidAmount).toFixed(2));
      updated.status = statusFor(updated.amount, updated.paidAmount, updated.dueDate);
      await Invoice.updateOne({ _id: updated._id }, { $set: { outstandingAmount: updated.outstandingAmount, status: updated.status } }, { session });
      await AuditLog.create([{ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'FEE_PAYMENT_RECORDED', details: `Recorded ${payment.paymentReference} for ${updated.invoiceNumber}`, ipAddress: req.ip || '127.0.0.1' }], { session });
      await session.commitTransaction();
    } catch (error) {
      if (transactionStarted) await session.abortTransaction();
      if (error.code === 11000) return next(new AppError('This payment reference has already been processed.', 409));
      if (error.statusCode) return next(error);
      // Standalone MongoDB deployments may not support transactions.
      if (error.code === 20 || /transaction numbers are only allowed/i.test(error.message)) {
        const duplicate = await Payment.findOne({ paymentReference }).lean();
        if (duplicate) return next(new AppError('This payment reference has already been processed.', 409));
        payment = await Payment.create({ paymentReference, invoice: invoice._id, student: invoice.student, amount: paymentAmount, method: req.body.method || 'simulated_online', notes: req.body.notes || '', recordedBy: req.user._id });
        const updated = await Invoice.findOneAndUpdate({ _id: invoice._id, $expr: { $lte: [{ $add: ['$paidAmount', paymentAmount] }, '$amount'] } }, { $inc: { paidAmount: paymentAmount } }, { new: true });
        if (!updated) { await Payment.deleteOne({ _id: payment._id }); return next(new AppError('Invoice balance changed; payment was not processed.', 409)); }
        updated.outstandingAmount = Number((updated.amount - updated.paidAmount).toFixed(2));
        updated.status = statusFor(updated.amount, updated.paidAmount, updated.dueDate);
        await Invoice.updateOne({ _id: updated._id }, { $set: { outstandingAmount: updated.outstandingAmount, status: updated.status } });
        await AuditLog.create({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'FEE_PAYMENT_RECORDED', details: `Recorded ${payment.paymentReference} for ${updated.invoiceNumber}`, ipAddress: req.ip || '127.0.0.1' });
      } else throw error;
    }
    sendSuccess(res, payment, 'Payment recorded successfully', 201);
  } catch (error) { next(error); } finally { await session.endSession(); }
};

export const getFeeStats = async (req, res, next) => {
  try {
    const [stats] = await Invoice.aggregate([{ $group: { _id: null, totalInvoiced: { $sum: '$amount' }, totalCollected: { $sum: '$paidAmount' }, invoiceCount: { $sum: 1 }, paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } } } }]);
    const data = stats || { totalInvoiced: 0, totalCollected: 0, invoiceCount: 0, paidCount: 0 };
    data.totalOutstanding = Number((data.totalInvoiced - data.totalCollected).toFixed(2));
    data.collectionRate = data.totalInvoiced ? Number((data.totalCollected / data.totalInvoiced * 100).toFixed(1)) : 0;
    sendSuccess(res, data, 'Fee statistics retrieved successfully');
  } catch (error) { next(error); }
};

export const getReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate({ path: 'invoice', populate: [{ path: 'student', select: 'name admissionNumber guardian class section' }, { path: 'class', select: 'name code' }] }).lean();
    if (!payment) return next(new AppError('Payment not found.', 404));
    await ensureInvoiceAccess(req, payment.invoice);
    sendSuccess(res, payment, 'Payment receipt retrieved successfully');
  } catch (error) { next(error); }
};
