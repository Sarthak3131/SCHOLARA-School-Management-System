import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Examination from '../models/Examination.js';
import Result from '../models/Result.js';
import Invoice from '../models/Invoice.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${label}.`, 400);
  return new mongoose.Types.ObjectId(value);
};

const dateRange = (from, to) => {
  if (!from && !to) return null;
  const range = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.$lte = new Date(`${to}T23:59:59.999Z`);
  if (Object.values(range).some((date) => Number.isNaN(date.getTime()))) throw new AppError('Invalid report date range.', 400);
  return range;
};

export const getStudentReport = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', classId, section, status } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const query = {};
    if (search.trim()) query.$or = [{ name: { $regex: search.trim(), $options: 'i' } }, { admissionNumber: { $regex: search.trim(), $options: 'i' } }, { rollNumber: { $regex: search.trim(), $options: 'i' } }];
    if (classId) query.class = objectId(classId, 'class');
    if (section) query.section = section.toUpperCase();
    if (status) query.status = status;
    const [total, students, distribution] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query).populate('class', 'name code').select('name admissionNumber rollNumber class section status guardian').sort({ name: 1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
      Student.aggregate([{ $match: query }, { $group: { _id: { class: '$class', section: '$section' }, count: { $sum: 1 } } }, { $lookup: { from: 'classes', localField: '_id.class', foreignField: '_id', as: 'class' } }, { $unwind: '$class' }, { $project: { _id: 0, classId: '$_id.class', classCode: '$class.code', className: '$class.name', section: '$_id.section', count: 1 } }, { $sort: { classCode: 1, section: 1 } }]),
    ]);
    const [totalStudents, activeStudents, inactiveStudents] = await Promise.all([Student.countDocuments(), Student.countDocuments({ status: 'active' }), Student.countDocuments({ status: { $ne: 'active' } })]);
    sendSuccess(res, { records: students, summary: { totalStudents, activeStudents, inactiveStudents }, distribution, pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) } }, 'Student report retrieved successfully');
  } catch (error) { next(error); }
};

export const getAttendanceReport = async (req, res, next) => {
  try {
    const match = {};
    const range = dateRange(req.query.from, req.query.to);
    if (range) match.date = range;
    if (req.query.classId) match.class = objectId(req.query.classId, 'class');
    if (req.query.section) match.section = req.query.section.toUpperCase();
    const [summary, byClass] = await Promise.all([
      Attendance.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Attendance.aggregate([{ $match: match }, { $group: { _id: { class: '$class', section: '$section' }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }, late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }, total: { $sum: 1 } } }, { $lookup: { from: 'classes', localField: '_id.class', foreignField: '_id', as: 'class' } }, { $unwind: '$class' }, { $project: { _id: 0, classCode: '$class.code', className: '$class.name', section: '$_id.section', present: 1, absent: 1, late: 1, total: 1, attendanceRate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } }, { $sort: { classCode: 1, section: 1 } }]),
    ]);
    const counts = summary.reduce((result, item) => ({ ...result, [item._id]: item.count }), {});
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    sendSuccess(res, { summary: { total, present: counts.present || 0, absent: counts.absent || 0, late: counts.late || 0, excused: counts.excused || 0, attendanceRate: total ? Number(((counts.present || 0) / total * 100).toFixed(1)) : 0 }, byClass }, 'Attendance report retrieved successfully');
  } catch (error) { next(error); }
};

export const getExaminationReport = async (req, res, next) => {
  try {
    const match = {};
    if (req.query.examinationId) match.examination = objectId(req.query.examinationId, 'examination');
    const report = await Result.aggregate([{ $match: match }, { $group: { _id: '$examination', totalMarks: { $sum: '$marks' }, totalMaxMarks: { $sum: '$maxMarks' }, averagePercentage: { $avg: '$percentage' }, resultCount: { $sum: 1 }, passCount: { $sum: { $cond: [{ $ne: ['$grade', 'F'] }, 1, 0] } } } }, { $lookup: { from: 'examinations', localField: '_id', foreignField: '_id', as: 'examination' } }, { $unwind: '$examination' }, { $project: { _id: 0, examinationId: '$_id', name: '$examination.name', scheduledDate: '$examination.scheduledDate', totalMarks: 1, totalMaxMarks: 1, resultCount: 1, passCount: 1, averagePercentage: { $round: ['$averagePercentage', 1] }, passRate: { $round: [{ $multiply: [{ $divide: ['$passCount', '$resultCount'] }, 100] }, 1] } } }, { $sort: { scheduledDate: -1 } }]);
    sendSuccess(res, report, 'Examination report retrieved successfully');
  } catch (error) { next(error); }
};

export const getFeeReport = async (req, res, next) => {
  try {
    const match = {};
    const range = dateRange(req.query.from, req.query.to);
    if (range) match.createdAt = range;
    if (req.query.classId) match.class = objectId(req.query.classId, 'class');
    if (req.query.status) match.status = req.query.status;
    const [summary, byStatus, byClass] = await Promise.all([
      Invoice.aggregate([{ $match: match }, { $group: { _id: null, invoiceCount: { $sum: 1 }, totalInvoiced: { $sum: '$amount' }, totalCollected: { $sum: '$paidAmount' } } }]),
      Invoice.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' }, collected: { $sum: '$paidAmount' } } }, { $sort: { _id: 1 } }]),
      Invoice.aggregate([{ $match: match }, { $group: { _id: '$class', invoiceCount: { $sum: 1 }, totalInvoiced: { $sum: '$amount' }, totalCollected: { $sum: '$paidAmount' } } }, { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } }, { $unwind: '$class' }, { $project: { _id: 0, classCode: '$class.code', className: '$class.name', invoiceCount: 1, totalInvoiced: 1, totalCollected: 1, outstanding: { $subtract: ['$totalInvoiced', '$totalCollected'] } } }, { $sort: { classCode: 1 } }]),
    ]);
    const data = summary[0] || { invoiceCount: 0, totalInvoiced: 0, totalCollected: 0 };
    sendSuccess(res, { summary: { ...data, totalOutstanding: Number((data.totalInvoiced - data.totalCollected).toFixed(2)), collectionRate: data.totalInvoiced ? Number((data.totalCollected / data.totalInvoiced * 100).toFixed(1)) : 0 }, byStatus, byClass }, 'Fee report retrieved successfully');
  } catch (error) { next(error); }
};
