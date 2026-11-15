import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getStudentReport, getAttendanceReport, getExaminationReport, getFeeReport } from '../controllers/reportController.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/students', getStudentReport);
router.get('/attendance', getAttendanceReport);
router.get('/examinations', getExaminationReport);
router.get('/fees', getFeeReport);
export default router;
