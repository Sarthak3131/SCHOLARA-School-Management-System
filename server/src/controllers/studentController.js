import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

/**
 * @desc    Get all students with search, filters, and pagination
 * @route   GET /api/students
 * @access  Private (Admin, Teacher)
 */
export const getStudents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      classId,
      section,
      status,
    } = req.query;

    const query = {};

    // Search by name or admission number
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { admissionNumber: { $regex: search.trim(), $options: 'i' } },
        { rollNumber: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (classId) {
      query.class = classId;
    }

    if (section) {
      query.section = section.toUpperCase();
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query)
        .populate('class', 'name code')
        .populate('guardian', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    sendPaginated(res, students, pageNum, limitNum, total, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getLinkedStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ guardian: req.user._id, status: { $in: ['active', 'graduated'] } })
      .populate('class', 'name code')
      .select('name admissionNumber rollNumber class section gender status')
      .sort({ name: 1 })
      .lean();
    sendSuccess(res, students, 'Linked students retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student profile with academic history & attendance
 * @route   GET /api/students/:id
 * @access  Private (Admin, Teacher, Guardian of ward)
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('class', 'name code sections')
      .populate('guardian', 'name email phone avatar')
      .lean();

    if (!student) {
      return next(new AppError('Student profile not found.', 404));
    }

    // Role boundary check: if user is guardian, verify this is their ward
    if (req.user.role === 'guardian') {
      if (!student.guardian || student.guardian._id.toString() !== req.user._id.toString()) {
        return next(new AppError('Forbidden: Access restricted to authorized ward records only.', 403));
      }
    }

    // Aggregate attendance telemetry for student
    const attendanceRecords = await Attendance.aggregate([
      { $match: { student: student._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const present = attendanceRecords.find((r) => r._id === 'present')?.count || 0;
    const absent = attendanceRecords.find((r) => r._id === 'absent')?.count || 0;
    const late = attendanceRecords.find((r) => r._id === 'late')?.count || 0;
    const totalDays = present + absent + late;
    const attendanceRate = totalDays > 0 ? Number(((present / totalDays) * 100).toFixed(1)) : 0;

    // Student fee ledger
    const invoices = await Invoice.find({ student: student._id })
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, {
      student,
      attendanceTelemetry: {
        present,
        absent,
        late,
        totalDays,
        attendanceRate,
      },
      invoices,
    }, 'Student profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll a new student
 * @route   POST /api/students
 * @access  Private (Admin only)
 */
export const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      admissionNumber,
      rollNumber,
      classId,
      section,
      gender,
      dob,
      guardian,
      email,
      phone,
      address,
      bloodGroup,
    } = req.body;

    // Generate unique admission number if not provided
    let adm = admissionNumber;
    if (!adm) {
      const count = await Student.countDocuments();
      adm = `SCH-2024-${String(count + 1).padStart(3, '0')}`;
    } else {
      const exists = await Student.findOne({ admissionNumber: adm.toUpperCase() });
      if (exists) {
        return next(new AppError(`Admission number ${adm} already in use.`, 409));
      }
    }

    const student = await Student.create({
      name,
      admissionNumber: adm.toUpperCase(),
      rollNumber: rollNumber || '',
      class: classId,
      section: (section || 'A').toUpperCase(),
      gender: gender || 'male',
      dob,
      guardian: guardian || null,
      email,
      phone,
      address,
      bloodGroup,
      status: 'active',
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'STUDENT_ENROLLED',
      details: `Enrolled student ${student.name} with Admission #${student.admissionNumber}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const populatedStudent = await Student.findById(student._id)
      .populate('class', 'name code')
      .populate('guardian', 'name email phone');

    sendSuccess(res, populatedStudent, 'Student registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student details
 * @route   PUT /api/students/:id
 * @access  Private (Admin only)
 */
export const updateStudent = async (req, res, next) => {
  try {
    const {
      name,
      rollNumber,
      classId,
      section,
      gender,
      dob,
      guardian,
      email,
      phone,
      address,
      bloodGroup,
      status,
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new AppError('Student not found.', 404));
    }

    if (name) student.name = name;
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (classId) student.class = classId;
    if (section) student.section = section.toUpperCase();
    if (gender) student.gender = gender;
    if (dob) student.dob = dob;
    if (guardian !== undefined) {
      if (guardian) {
        const guardianUser = await User.findOne({ _id: guardian, role: 'guardian', isActive: true });
        if (!guardianUser) {
          return next(new AppError('Selected guardian account is invalid or inactive.', 400));
        }
      }
      student.guardian = guardian || null;
    }
    if (email !== undefined) student.email = email;
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
    if (status) student.status = status;

    await student.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'STUDENT_UPDATED',
      details: `Updated institutional file for ${student.name} (${student.admissionNumber})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const updated = await Student.findById(student._id)
      .populate('class', 'name code')
      .populate('guardian', 'name email phone');

    sendSuccess(res, updated, 'Student information updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate or remove student
 * @route   DELETE /api/students/:id
 * @access  Private (Admin only)
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new AppError('Student not found.', 404));
    }

    // Soft delete / deactivate
    student.status = 'inactive';
    await student.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'STUDENT_UPDATED',
      details: `Deactivated student record ${student.name} (${student.admissionNumber})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    sendSuccess(res, { id: student._id }, 'Student account deactivated successfully');
  } catch (error) {
    next(error);
  }
};
