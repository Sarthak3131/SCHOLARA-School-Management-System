import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

const parseDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const id = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${label}.`, 400);
  return new mongoose.Types.ObjectId(value);
};

const teacherAssignments = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId, status: 'active' }).lean();
  if (!teacher) throw new AppError('Active teacher profile not found.', 403);
  return teacher.assignedClasses || [];
};

const canAccessClass = (req, classId, section) => {
  if (req.user.role !== 'teacher') return Promise.resolve(true);
  return teacherAssignments(req.user._id).then((assignments) =>
    assignments.some((assignment) =>
      assignment.class?.toString() === classId.toString() &&
      assignment.section === section.toUpperCase()
    )
  );
};

const scopeQuery = async (req, query) => {
  if (req.user.role === 'guardian') {
    const linked = await Student.find({ guardian: req.user._id }).select('_id').lean();
    const linkedIds = linked.map((student) => student._id);
    if (query.student && !linkedIds.some((studentId) => studentId.toString() === query.student.toString())) {
      throw new AppError('Forbidden: Student is not linked to this guardian.', 403);
    }
    if (!query.student) query.student = { $in: linkedIds };
  }
  if (req.user.role === 'teacher') {
    const assignments = await teacherAssignments(req.user._id);
    const allowed = assignments.map((assignment) => ({
      class: assignment.class,
      section: assignment.section,
    }));
    query.$or = allowed.length ? allowed : [{ _id: null }];
  }
  return query;
};

export const getAttendanceOptions = async (req, res, next) => {
  try {
    if (req.user.role === 'teacher') {
      const assignments = await teacherAssignments(req.user._id);
      const classIds = [...new Set(assignments.map((item) => item.class.toString()))];
      const classes = await Class.find({ _id: { $in: classIds } }).select('name code sections').sort({ code: 1 }).lean();
      return sendSuccess(res, { classes, assignments }, 'Attendance options retrieved successfully');
    }
    const classes = await Class.find().select('name code sections').sort({ code: 1 }).lean();
    sendSuccess(res, { classes }, 'Attendance options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRoster = async (req, res, next) => {
  try {
    const { classId, section, date, session = 'daily' } = req.query;
    const classObjectId = id(classId, 'class');
    const normalizedSection = section?.toUpperCase();
    const parsedDate = parseDate(date);
    if (!normalizedSection || !parsedDate) return next(new AppError('Class, section, and a valid date are required.', 400));
    if (!(await canAccessClass(req, classObjectId, normalizedSection))) {
      return next(new AppError('Forbidden: You are not assigned to this class and section.', 403));
    }
    const students = await Student.find({
      class: classObjectId,
      section: normalizedSection,
      status: 'active',
    }).select('name admissionNumber rollNumber class section').sort({ rollNumber: 1, name: 1 }).lean();
    const existing = await Attendance.find({
      class: classObjectId,
      section: normalizedSection,
      date: parsedDate,
      session,
    }).select('student status remarks').lean();
    const existingByStudent = new Map(existing.map((record) => [record.student.toString(), record]));
    sendSuccess(res, students.map((student) => ({
      ...student,
      attendance: existingByStudent.get(student._id.toString()) || null,
    })), 'Attendance roster retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const { date, classId, section, status, studentId } = req.query;
    const query = {};
    if (date) {
      const parsed = parseDate(date);
      if (!parsed) return next(new AppError('Attendance date must use YYYY-MM-DD format.', 400));
      query.date = parsed;
    }
    if (classId) query.class = id(classId, 'class');
    if (section) query.section = section.toUpperCase();
    if (status) {
      if (!VALID_STATUSES.includes(status)) return next(new AppError('Invalid attendance status.', 400));
      query.status = status;
    }
    if (studentId) query.student = id(studentId, 'student');
    await scopeQuery(req, query);

    const records = await Attendance.find(query)
      .populate('student', 'name admissionNumber rollNumber class section')
      .populate('class', 'name code')
      .populate('recordedBy', 'name')
      .sort({ date: -1, 'student.name': 1 })
      .lean();
    const counts = records.reduce((summary, record) => {
      summary[record.status] = (summary[record.status] || 0) + 1;
      return summary;
    }, {});
    const marked = records.length;
    const present = counts.present || 0;
    sendSuccess(res, {
      records,
      stats: {
        total: marked,
        present,
        absent: counts.absent || 0,
        late: counts.late || 0,
        excused: counts.excused || 0,
        attendanceRate: marked ? Number(((present / marked) * 100).toFixed(1)) : 0,
      },
    }, 'Attendance records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getAttendanceSummary = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.studentId) query.student = id(req.query.studentId, 'student');
    if (req.query.date) {
      const parsed = parseDate(req.query.date);
      if (!parsed) return next(new AppError('Attendance date must use YYYY-MM-DD format.', 400));
      query.date = parsed;
    }
    await scopeQuery(req, query);
    const records = await Attendance.find(query).select('status').lean();
    const summary = records.reduce((result, record) => {
      result[record.status] = (result[record.status] || 0) + 1;
      return result;
    }, {});
    const total = records.length;
    sendSuccess(res, {
      total,
      present: summary.present || 0,
      absent: summary.absent || 0,
      late: summary.late || 0,
      excused: summary.excused || 0,
      attendanceRate: total ? Number((((summary.present || 0) / total) * 100).toFixed(1)) : 0,
    }, 'Attendance summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const submitAttendance = async (req, res, next) => {
  try {
    const { date, session = 'daily', classId, section, records } = req.body;
    const parsedDate = parseDate(date);
    if (!parsedDate) return next(new AppError('Attendance date must use YYYY-MM-DD format.', 400));
    if (parsedDate > new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')) {
      return next(new AppError('Attendance cannot be recorded for a future date.', 400));
    }
    if (!['morning', 'afternoon', 'daily'].includes(session)) return next(new AppError('Invalid attendance session.', 400));
    const classObjectId = id(classId, 'class');
    if (!section?.trim()) return next(new AppError('Class, section, and attendance records are required.', 400));
    const normalizedSection = section.toUpperCase();
    if (!(await canAccessClass(req, classObjectId, normalizedSection))) {
      return next(new AppError('Forbidden: You are not assigned to this class and section.', 403));
    }
    if (!Array.isArray(records) || records.length === 0) {
      return next(new AppError('Class, section, and attendance records are required.', 400));
    }
    const studentIds = records.map((record) => id(record.student, 'student'));
    if (new Set(studentIds.map(String)).size !== studentIds.length) return next(new AppError('Duplicate students in attendance submission.', 400));
    if (records.some((record) => !VALID_STATUSES.includes(record.status))) return next(new AppError('Invalid attendance status.', 400));
    const students = await Student.find({
      _id: { $in: studentIds },
      class: classObjectId,
      section: normalizedSection,
      status: 'active',
    }).select('_id').lean();
    if (students.length !== studentIds.length) return next(new AppError('Attendance includes a student outside the selected class or section.', 403));
    const existing = await Attendance.find({
      student: { $in: studentIds },
      date: parsedDate,
      session,
    }).select('student').lean();
    if (existing.length) return next(new AppError('Attendance already exists for one or more students on this date and session.', 409));

    const documents = records.map((record) => ({
      student: record.student,
      class: classObjectId,
      section: normalizedSection,
      date: parsedDate,
      session,
      status: record.status,
      remarks: record.remarks || '',
      recordedBy: req.user._id,
    }));
    let created;
    try {
      created = await Attendance.insertMany(documents, { ordered: true });
    } catch (error) {
      if (error.code === 11000) return next(new AppError('Attendance already exists for one or more students on this date and session.', 409));
      throw error;
    }
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ATTENDANCE_RECORDED',
      details: `Submitted attendance for ${normalizedSection} on ${date} (${created.length} students)`,
      ipAddress: req.ip || '127.0.0.1',
    });
    sendSuccess(res, created, 'Attendance submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return next(new AppError('Attendance record not found.', 404));
    if (!VALID_STATUSES.includes(req.body.status)) return next(new AppError('Invalid attendance status.', 400));
    if (!(await canAccessClass(req, attendance.class, attendance.section))) {
      return next(new AppError('Forbidden: You are not assigned to this class and section.', 403));
    }
    attendance.status = req.body.status;
    if (req.body.remarks !== undefined) attendance.remarks = req.body.remarks;
    attendance.recordedBy = req.user._id;
    await attendance.save();
    sendSuccess(res, attendance, 'Attendance updated successfully');
  } catch (error) {
    next(error);
  }
};
