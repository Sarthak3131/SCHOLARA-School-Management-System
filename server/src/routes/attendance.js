import express from 'express';
import {
  getAttendanceOptions,
  getAttendance,
  getAttendanceRoster,
  getAttendanceSummary,
  submitAttendance,
  updateAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/options', authorize('admin', 'teacher'), getAttendanceOptions);
router.get('/summary', authorize('admin', 'teacher', 'guardian'), getAttendanceSummary);
router.get('/roster', authorize('admin', 'teacher'), getAttendanceRoster);
router.get('/', authorize('admin', 'teacher', 'guardian'), getAttendance);
router.post('/', authorize('admin', 'teacher'), submitAttendance);
router.put('/:id', authorize('admin', 'teacher'), updateAttendance);

export default router;
