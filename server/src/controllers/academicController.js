import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

// ── Classes & Sections ────────────────────────────────────────────────────────

export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ code: 1 }).lean();

    // Attach student count to each class
    const enhancedClasses = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ class: cls._id, status: 'active' });
        return {
          ...cls,
          studentCount,
        };
      })
    );

    sendSuccess(res, enhancedClasses, 'Classes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const { name, code, sections = [{ name: 'A', capacity: 35 }], academicYear } = req.body;
    if (!name?.trim() || !code?.trim() || !Array.isArray(sections) || sections.length === 0) {
      return next(new AppError('Class name, code, and at least one section are required.', 400));
    }

    const existing = await Class.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(new AppError(`Class code ${code} is already registered.`, 409));
    }

    const newClass = await Class.create({
      name,
      code: code.toUpperCase(),
      sections: sections.map((s) => ({
        name: s.name.toUpperCase(),
        capacity: s.capacity || 35,
      })),
      academicYear: academicYear || '2024-2025',
    });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SYSTEM_CONFIG_UPDATED',
      details: `Created new academic cohort: ${newClass.name} (${newClass.code})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    sendSuccess(res, newClass, 'Academic class created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const { name, sections, academicYear } = req.body;
    if (name !== undefined && !name.trim()) {
      return next(new AppError('Class name cannot be empty.', 400));
    }
    if (sections !== undefined && (!Array.isArray(sections) || sections.length === 0 || sections.some((section) => !section.name?.trim()))) {
      return next(new AppError('At least one valid class section is required.', 400));
    }
    const cls = await Class.findById(req.params.id);

    if (!cls) {
      return next(new AppError('Class not found.', 404));
    }

    if (name) cls.name = name;
    if (sections) {
      cls.sections = sections.map((s) => ({
        name: s.name.toUpperCase(),
        capacity: s.capacity || 35,
      }));
    }
    if (academicYear) cls.academicYear = academicYear;

    await cls.save();
    sendSuccess(res, cls, 'Class updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) {
      return next(new AppError('Class not found.', 404));
    }

    // Safety constraint: Prevent deletion if active students exist
    const studentCount = await Student.countDocuments({ class: cls._id, status: 'active' });
    if (studentCount > 0) {
      return next(
        new AppError(
          `Cannot delete ${cls.name}: ${studentCount} active students are currently enrolled. Reassign them first.`,
          400
        )
      );
    }

    await Class.findByIdAndDelete(cls._id);
    sendSuccess(res, { id: cls._id }, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ── Subjects ──────────────────────────────────────────────────────────────────

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ code: 1 }).lean();
    sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, type, weeklyPeriods, credits } = req.body;
    if (!name?.trim() || !code?.trim()) {
      return next(new AppError('Subject name and code are required.', 400));
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(new AppError(`Subject code ${code} is already in use.`, 409));
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department: department || 'General Academics',
      type: type || 'theory',
      weeklyPeriods: weeklyPeriods || 5,
      credits: credits || 4,
    });

    sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { name, department, type, weeklyPeriods, credits } = req.body;
    if (name !== undefined && !name.trim()) {
      return next(new AppError('Subject name cannot be empty.', 400));
    }
    if (weeklyPeriods !== undefined && (!Number.isInteger(Number(weeklyPeriods)) || Number(weeklyPeriods) < 1)) {
      return next(new AppError('Weekly periods must be a positive whole number.', 400));
    }
    if (credits !== undefined && (!Number.isInteger(Number(credits)) || Number(credits) < 1)) {
      return next(new AppError('Credits must be a positive whole number.', 400));
    }
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new AppError('Subject not found.', 404));
    }

    if (name) subject.name = name;
    if (department) subject.department = department;
    if (type) subject.type = type;
    if (weeklyPeriods) subject.weeklyPeriods = weeklyPeriods;
    if (credits) subject.credits = credits;

    await subject.save();
    sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return next(new AppError('Subject not found.', 404));
    }

    subject.isActive = false;
    await subject.save();

    sendSuccess(res, { id: subject._id }, 'Subject deactivated successfully');
  } catch (error) {
    next(error);
  }
};

// ── Guardians Helper ──────────────────────────────────────────────────────────

export const getGuardians = async (req, res, next) => {
  try {
    const guardians = await User.find({ role: 'guardian', isActive: true })
      .select('name email phone')
      .sort({ name: 1 })
      .lean();

    sendSuccess(res, guardians, 'Guardians retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getGuardianManagement = async (req, res, next) => {
  try {
    const guardians = await User.find({ role: 'guardian', isActive: true })
      .select('name email phone')
      .sort({ name: 1 })
      .lean();
    const guardianIds = guardians.map((guardian) => guardian._id);
    const students = await Student.find({ guardian: { $in: guardianIds } })
      .select('name admissionNumber class section guardian status')
      .populate('class', 'name code')
      .sort({ name: 1 })
      .lean();
    const studentsByGuardian = students.reduce((groups, student) => {
      const key = student.guardian.toString();
      groups[key] = groups[key] || [];
      groups[key].push(student);
      return groups;
    }, {});

    sendSuccess(
      res,
      guardians.map((guardian) => ({
        ...guardian,
        linkedStudents: studentsByGuardian[guardian._id.toString()] || [],
      })),
      'Guardian management records retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
