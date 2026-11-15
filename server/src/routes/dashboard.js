import express from 'express';
import { getAdminDashboardStats } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected Admin Dashboard Route
router.get('/admin', protect, authorize('admin'), getAdminDashboardStats);

export default router;
