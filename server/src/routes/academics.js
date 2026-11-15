import express from 'express';
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getGuardians,
  getGuardianManagement,
} from '../controllers/academicController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Classes & Sections
router
  .route('/classes')
  .get(getClasses)
  .post(authorize('admin'), createClass);

router
  .route('/classes/:id')
  .put(authorize('admin'), updateClass)
  .delete(authorize('admin'), deleteClass);

// Subjects
router
  .route('/subjects')
  .get(getSubjects)
  .post(authorize('admin'), createSubject);

router
  .route('/subjects/:id')
  .put(authorize('admin'), updateSubject)
  .delete(authorize('admin'), deleteSubject);

// Guardians lookup
router.get('/guardians', authorize('admin', 'teacher'), getGuardians);
router.get('/guardians/management', authorize('admin'), getGuardianManagement);

export default router;
