import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getAuditLogs, getAuditLog } from '../controllers/auditController.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);
export default router;
