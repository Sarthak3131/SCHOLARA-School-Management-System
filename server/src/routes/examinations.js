import express from 'express';
import {
  getExaminations, createExamination, updateExamination, deleteExamination,
  getExamRoster, submitResults, getResults, getReportCard,
} from '../controllers/examinationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', authorize('admin', 'teacher', 'guardian'), getExaminations);
router.post('/', authorize('admin'), createExamination);
router.put('/:id', authorize('admin'), updateExamination);
router.delete('/:id', authorize('admin'), deleteExamination);
router.get('/:id/roster', authorize('admin', 'teacher'), getExamRoster);
router.get('/results', authorize('admin', 'teacher', 'guardian'), getResults);
router.post('/results', authorize('admin', 'teacher'), submitResults);
router.get('/report-card/:studentId', authorize('admin', 'teacher', 'guardian'), getReportCard);

export default router;
