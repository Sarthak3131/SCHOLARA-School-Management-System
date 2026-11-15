import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

/**
 * @desc    Get all teachers with search and pagination
 * @route   GET /api/teachers
 * @access  Private (Admin)
 */
export const getTeachers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Search filter across teacher user name and employeeId
    let userIds = null;
    if (search.trim()) {
      const matchingUsers = await User.find({
        role: 'teacher',
        name: { $regex: search.trim(), $options: 'i' },
      }).select('_id');
      userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { employeeId: { $regex: search.trim(), $options: 'i' } },
        { specialization: { $regex: search.trim(), $options: 'i' } },
        { user: { $in: userIds } },
      ];
    }

    const [total, teachers] = await Promise.all([
      Teacher.countDocuments(query),
      Teacher.find(query)
        .populate('user', 'name email phone avatar isActive lastLogin')
        .populate('assignedClasses.class', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    sendPaginated(res, teachers, pageNum, limitNum, total, 'Teachers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single teacher profile
 * @route   GET /api/teachers/:id
 * @access  Private (Admin, Teacher self)
 */
export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'name email phone avatar isActive lastLogin createdAt')
      .populate('assignedClasses.class', 'name code sections')
      .lean();

    if (!teacher) {
      return next(new AppError('Teacher profile not found.', 404));
    }

    sendSuccess(res, teacher, 'Teacher profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new faculty teacher
 * @route   POST /api/teachers
 * @access  Private (Admin only)
 */
export const createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      employeeId,
      specialization,
      qualification,
      assignedClasses = [],
    } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return next(new AppError('Teacher name and email are required.', 400));
    }

    // 1. Check or generate Employee ID
    let empId = employeeId;
    if (!empId) {
      const count = await Teacher.countDocuments();
      empId = `FAC-${101 + count}`;
    } else {
      const existingEmp = await Teacher.findOne({ employeeId: empId.toUpperCase() });
      if (existingEmp) {
        return next(new AppError(`Employee ID ${empId} is already assigned.`, 409));
      }
    }

    // 2. Check if user email already exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.role !== 'teacher') {
        return next(new AppError('A user with this email exists with a non-teacher role.', 409));
      }
      const existingTeacher = await Teacher.findOne({ user: user._id });
      if (existingTeacher) {
        return next(new AppError('Teacher profile for this user already exists.', 409));
      }
    } else {
      // Create user account for teacher
      user = await User.create({
        name,
        email,
        password: password || 'Teacher@123',
        role: 'teacher',
        phone: phone || '',
      });
    }

    // 3. Create Teacher document
    const teacher = await Teacher.create({
      user: user._id,
      employeeId: empId.toUpperCase(),
      specialization: specialization || 'General Faculty',
      qualification: qualification || 'B.Ed.',
      assignedClasses,
      status: 'active',
    });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TEACHER_ASSIGNED',
      details: `Registered faculty educator ${user.name} (${teacher.employeeId})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const populated = await Teacher.findById(teacher._id)
      .populate('user', 'name email phone')
      .populate('assignedClasses.class', 'name code');

    sendSuccess(res, populated, 'Faculty educator created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update teacher profile
 * @route   PUT /api/teachers/:id
 * @access  Private (Admin only)
 */
export const updateTeacher = async (req, res, next) => {
  try {
    const { specialization, qualification, status, name, phone } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return next(new AppError('Teacher not found.', 404));
    }

    if (specialization !== undefined) teacher.specialization = specialization;
    if (qualification !== undefined) teacher.qualification = qualification;
    if (status !== undefined) teacher.status = status;

    await teacher.save();

    // Update underlying user record if name or phone changed
    if (name || phone) {
      const user = await User.findById(teacher.user);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        await user.save();
      }
    }

    const updated = await Teacher.findById(teacher._id)
      .populate('user', 'name email phone')
      .populate('assignedClasses.class', 'name code');

    sendSuccess(res, updated, 'Teacher profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign classes and subjects to teacher
 * @route   PATCH /api/teachers/:id/assignments
 * @access  Private (Admin only)
 */
export const assignTeacherClasses = async (req, res, next) => {
  try {
    const { assignedClasses } = req.body;

    if (!Array.isArray(assignedClasses)) {
      return next(new AppError('assignedClasses must be an array of assignments.', 400));
    }
    if (assignedClasses.some((assignment) => !assignment.class || !assignment.section || !assignment.subject?.trim())) {
      return next(new AppError('Each assignment requires a class, section, and subject.', 400));
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return next(new AppError('Teacher not found.', 404));
    }

    teacher.assignedClasses = assignedClasses;
    await teacher.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TEACHER_ASSIGNED',
      details: `Updated classroom assignments for faculty ID ${teacher.employeeId} (${assignedClasses.length} assignments)`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const populated = await Teacher.findById(teacher._id)
      .populate('user', 'name email phone')
      .populate('assignedClasses.class', 'name code');

    sendSuccess(res, populated, 'Teacher assignments updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private (Admin only)
 */
export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return next(new AppError('Teacher not found.', 404));
    }

    teacher.status = 'resigned';
    await teacher.save();

    // Also deactivate user
    await User.findByIdAndUpdate(teacher.user, { isActive: false });

    sendSuccess(res, { id: teacher._id }, 'Teacher account deactivated successfully');
  } catch (error) {
    next(error);
  }
};
