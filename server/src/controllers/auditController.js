import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const validModules = ['student', 'teacher', 'guardian', 'class', 'subject', 'attendance', 'examination', 'result', 'fee_structure', 'invoice', 'payment', 'auth', 'system'];

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', module, action, actorId, from, to } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const query = {};
    if (module) {
      if (!validModules.includes(module)) return next(new AppError('Invalid audit module.', 400));
      query.module = module;
    }
    if (action) query.action = action;
    if (actorId) {
      if (!mongoose.isValidObjectId(actorId)) return next(new AppError('Invalid audit actor.', 400));
      query.user = actorId;
    }
    if (search.trim()) query.$or = [{ details: { $regex: search.trim(), $options: 'i' } }, { userName: { $regex: search.trim(), $options: 'i' } }];
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    const [total, logs, actors] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query).populate('user', 'name email role').sort({ createdAt: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber).lean(),
      User.find({ role: { $in: ['admin', 'teacher', 'guardian'] }, isActive: true }).select('name role').sort({ name: 1 }).lean(),
    ]);
    sendSuccess(res, { logs, actors, pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) } }, 'Audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('user', 'name email role').lean();
    if (!log) return next(new AppError('Audit log not found.', 404));
    sendSuccess(res, log, 'Audit log retrieved successfully');
  } catch (error) {
    next(error);
  }
};
