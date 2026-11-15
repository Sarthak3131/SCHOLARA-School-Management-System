import express from 'express';
import {
  login,
  getMe,
  logout,
  register,
  changePassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  loginValidator,
  registerValidator,
  changePasswordValidator,
} from '../validators/authValidators.js';

const router = express.Router();

// Public routes
router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);
router.post('/logout', logout);

// Private authenticated routes
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePasswordValidator, changePassword);

// RBAC verification endpoint for automated test and integrity validation
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized: Administrator privileges verified.',
    user: req.user.email,
    role: req.user.role,
  });
});

export default router;
