import express from 'express';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  assignTeacherClasses,
  deleteTeacher,
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin'), getTeachers)
  .post(authorize('admin'), createTeacher);

router
  .route('/:id')
  .get(authorize('admin', 'teacher'), getTeacherById)
  .put(authorize('admin'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

router.patch('/:id/assignments', authorize('admin'), assignTeacherClasses);

export default router;
