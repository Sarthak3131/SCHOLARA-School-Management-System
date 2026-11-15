import mongoose from 'mongoose';
import Examination from '../models/Examination.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${label}.`, 400);
  return new mongoose.Types.ObjectId(value);
};

const defaultRules = [
  { minPercentage: 90, maxPercentage: 100, grade: 'A+', remark: 'Outstanding' },
  { minPercentage: 80, maxPercentage: 89.99, grade: 'A', remark: 'Excellent' },
  { minPercentage: 70, maxPercentage: 79.99, grade: 'B+', remark: 'Very Good' },
  { minPercentage: 60, maxPercentage: 69.99, grade: 'B', remark: 'Good' },
  { minPercentage: 50, maxPercentage: 59.99, grade: 'C', remark: 'Average' },
  { minPercentage: 40, maxPercentage: 49.99, grade: 'D', remark: 'Below Average' },
  { minPercentage: 0, maxPercentage: 39.99, grade: 'F', remark: 'Fail' },
];

const validateRules = (rules) => {
  if (!Array.isArray(rules) || !rules.length) throw new AppError('At least one grading rule is required.', 400);
  for (const rule of rules) {
    if (rule.minPercentage < 0 || rule.maxPercentage > 100 || rule.minPercentage > rule.maxPercentage || !rule.grade?.trim()) {
      throw new AppError('Invalid grading rule range or grade.', 400);
    }
  }
  return rules;
};

const gradeFor = (percentage, rules) => {
  const rule = rules.find((item) => percentage >= item.minPercentage && percentage <= item.maxPercentage);
  if (!rule) throw new AppError(`No grading rule covers ${percentage}%.`, 400);
  return rule;
};

const assignmentAllowed = async (userId, exam, subject) => {
  const teacher = await Teacher.findOne({ user: userId, status: 'active' }).lean();
  if (!teacher) return false;
  return teacher.assignedClasses.some((assignment) =>
    assignment.class.toString() === exam.class.toString() &&
    exam.sections.includes(assignment.section) &&
    (assignment.subject === subject.name || assignment.subject === subject.code)
  );
};

const accessibleExamQuery = async (req) => {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'guardian') {
    const students = await Student.find({ guardian: req.user._id }).select('class').lean();
    return { class: { $in: students.map((student) => student.class) } };
  }
  const teacher = await Teacher.findOne({ user: req.user._id, status: 'active' }).lean();
  const assignments = teacher?.assignedClasses || [];
  return assignments.length
    ? { $or: assignments.map((item) => ({ class: item.class, sections: item.section })) }
    : { _id: null };
};

export const getExaminations = async (req, res, next) => {
  try {
    const exams = await Examination.find(await accessibleExamQuery(req))
      .populate('class', 'name code')
      .populate('subjects.subject', 'name code')
      .sort({ scheduledDate: -1 })
      .lean();
    sendSuccess(res, exams, 'Examinations retrieved successfully');
  } catch (error) { next(error); }
};

export const createExamination = async (req, res, next) => {
  try {
    const { name, type, classId, sections, subjects, scheduledDate, academicYear, gradingRules = defaultRules, status = 'scheduled' } = req.body;
    if (!name?.trim() || !classId || !scheduledDate || !academicYear?.trim() || !Array.isArray(subjects) || !subjects.length) {
      return next(new AppError('Name, class, date, academic year, and subjects are required.', 400));
    }
    const classDoc = await Class.findById(objectId(classId, 'class')).lean();
    if (!classDoc) return next(new AppError('Class not found.', 404));
    const normalizedSections = (sections?.length ? sections : classDoc.sections.map((section) => section.name)).map((section) => section.toUpperCase());
    if (normalizedSections.some((section) => !classDoc.sections.some((item) => item.name === section))) return next(new AppError('Exam contains an invalid section.', 400));
    const subjectIds = subjects.map((item) => objectId(item.subject, 'subject'));
    const subjectCount = await Subject.countDocuments({ _id: { $in: subjectIds }, isActive: true });
    if (subjectCount !== subjectIds.length || subjects.some((item) => !Number.isFinite(Number(item.maxMarks)) || Number(item.maxMarks) <= 0)) return next(new AppError('Exam subjects and maximum marks are invalid.', 400));
    const exam = await Examination.create({ name, type, class: classDoc._id, sections: normalizedSections, subjects: subjects.map((item, index) => ({ subject: subjectIds[index], maxMarks: Number(item.maxMarks) })), scheduledDate, academicYear, gradingRules: validateRules(gradingRules), status });
    sendSuccess(res, exam, 'Examination created successfully', 201);
  } catch (error) { next(error); }
};

export const updateExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return next(new AppError('Examination not found.', 404));
    const allowed = ['name', 'type', 'scheduledDate', 'academicYear', 'status', 'sections'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) exam[field] = req.body[field]; });
    if (req.body.gradingRules) exam.gradingRules = validateRules(req.body.gradingRules);
    if (req.body.subjects) {
      if (req.body.subjects.some((item) => !Number.isFinite(Number(item.maxMarks)) || Number(item.maxMarks) <= 0)) return next(new AppError('Maximum marks must be greater than zero.', 400));
      exam.subjects = req.body.subjects.map((item) => ({ subject: objectId(item.subject, 'subject'), maxMarks: Number(item.maxMarks) }));
    }
    await exam.save();
    sendSuccess(res, exam, 'Examination updated successfully');
  } catch (error) { next(error); }
};

export const deleteExamination = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return next(new AppError('Examination not found.', 404));
    await Result.deleteMany({ examination: exam._id });
    await exam.deleteOne();
    sendSuccess(res, { id: exam._id }, 'Examination deleted successfully');
  } catch (error) { next(error); }
};

export const getExamRoster = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id).populate('subjects.subject', 'name code').lean();
    if (!exam) return next(new AppError('Examination not found.', 404));
    const examSubject = exam.subjects.find((item) => item.subject._id.toString() === req.query.subjectId)?.subject;
    if (!examSubject) return next(new AppError('Subject is not configured for this examination.', 400));
    if (req.user.role === 'teacher' && !(await assignmentAllowed(req.user._id, exam, examSubject))) return next(new AppError('Forbidden: Subject is not assigned to this teacher.', 403));
    const query = { class: exam.class, status: 'active', section: { $in: exam.sections } };
    if (req.query.section) query.section = req.query.section.toUpperCase();
    const students = await Student.find(query).select('name admissionNumber rollNumber class section').sort({ section: 1, rollNumber: 1, name: 1 }).lean();
    sendSuccess(res, { exam, students }, 'Examination roster retrieved successfully');
  } catch (error) { next(error); }
};

export const submitResults = async (req, res, next) => {
  try {
    const { examinationId, subjectId, results } = req.body;
    const exam = await Examination.findById(objectId(examinationId, 'examination')).lean();
    const subject = await Subject.findById(objectId(subjectId, 'subject')).lean();
    if (!exam || !subject) return next(new AppError('Examination or subject not found.', 404));
    const examSubject = exam.subjects.find((item) => item.subject.toString() === subject._id.toString());
    if (!examSubject) return next(new AppError('Subject is not configured for this examination.', 400));
    if (req.user.role === 'teacher' && !(await assignmentAllowed(req.user._id, exam, subject))) return next(new AppError('Forbidden: Subject is not assigned to this teacher.', 403));
    if (!Array.isArray(results) || !results.length) return next(new AppError('Results are required.', 400));
    const studentIds = results.map((item) => objectId(item.student, 'student'));
    const students = await Student.find({ _id: { $in: studentIds }, class: exam.class, section: { $in: exam.sections }, status: 'active' }).select('_id').lean();
    if (students.length !== studentIds.length) return next(new AppError('Result contains a student outside the examination scope.', 403));
    const rules = validateRules(exam.gradingRules);
    const docs = results.map((item) => {
      const marks = Number(item.marks);
      if (!Number.isFinite(marks) || marks < 0 || marks > examSubject.maxMarks) throw new AppError(`Marks must be between 0 and ${examSubject.maxMarks}.`, 400);
      const percentage = Number(((marks / examSubject.maxMarks) * 100).toFixed(2));
      const grade = gradeFor(percentage, rules);
      return { examination: exam._id, student: item.student, subject: subject._id, marks, maxMarks: examSubject.maxMarks, percentage, grade: grade.grade, remark: grade.remark, enteredBy: req.user._id };
    });
    let created;
    try { created = await Result.insertMany(docs, { ordered: true }); } catch (error) {
      if (error.code === 11000) return next(new AppError('A result already exists for one or more students, examination, and subject.', 409));
      throw error;
    }
    await AuditLog.create({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'MARKS_SUBMITTED', details: `Entered ${subject.name} results for ${exam.name}`, ipAddress: req.ip || '127.0.0.1' });
    sendSuccess(res, created, 'Results submitted successfully', 201);
  } catch (error) { next(error); }
};

export const getResults = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.examinationId) query.examination = objectId(req.query.examinationId, 'examination');
    if (req.query.studentId) query.student = objectId(req.query.studentId, 'student');
    if (req.query.subjectId) query.subject = objectId(req.query.subjectId, 'subject');
    if (req.user.role === 'guardian') {
      const linked = await Student.find({ guardian: req.user._id }).select('_id').lean();
      const linkedIds = linked.map((student) => student._id);
      if (query.student && !linkedIds.some((studentId) => studentId.toString() === query.student.toString())) {
        return next(new AppError('Forbidden: Student is not linked to this guardian.', 403));
      }
      if (!query.student) query.student = { $in: linkedIds };
    }
    const results = await Result.find(query).populate('student', 'name admissionNumber rollNumber class section').populate('subject', 'name code').populate('examination', 'name scheduledDate gradingRules').sort({ student: 1, subject: 1 }).lean();
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id }).lean();
      const allowed = teacher?.assignedClasses || [];
      const filtered = results.filter((result) => allowed.some((item) => item.class.toString() === result.student.class.toString() && item.section === result.student.section && (item.subject === result.subject.name || item.subject === result.subject.code)));
      return sendSuccess(res, filtered, 'Results retrieved successfully');
    }
    sendSuccess(res, results, 'Results retrieved successfully');
  } catch (error) { next(error); }
};

export const getReportCard = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('class', 'name code').lean();
    if (!student) return next(new AppError('Student not found.', 404));
    if (req.user.role === 'guardian' && student.guardian?.toString() !== req.user._id.toString()) return next(new AppError('Forbidden: Student is not linked to this guardian.', 403));
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id, status: 'active' }).lean();
      const allowed = teacher?.assignedClasses || [];
      if (!allowed.some((item) => item.class.toString() === student.class._id.toString() && item.section === student.section)) return next(new AppError('Forbidden: Student is outside your assigned classes.', 403));
    }
    const query = { student: student._id };
    if (req.query.examinationId) query.examination = objectId(req.query.examinationId, 'examination');
    const results = await Result.find(query).populate('subject', 'name code').populate('examination', 'name scheduledDate').lean();
    const total = results.reduce((sum, item) => sum + item.marks, 0);
    const maxTotal = results.reduce((sum, item) => sum + item.maxMarks, 0);
    const percentage = maxTotal ? Number(((total / maxTotal) * 100).toFixed(2)) : 0;
    const exam = results[0]?.examination;
    const grade = exam ? gradeFor(percentage, (await Examination.findById(exam._id).select('gradingRules').lean()).gradingRules) : { grade: 'N/A', remark: 'No results' };
    sendSuccess(res, { student, results, summary: { total, maxTotal, percentage, grade: grade.grade, remark: grade.remark } }, 'Report card generated successfully');
  } catch (error) { next(error); }
};
