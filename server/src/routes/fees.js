import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getFeeStructures, createFeeStructure, updateFeeStructure, getInvoices,
  createInvoice, getPayments, recordPayment, getFeeStats, getReceipt,
} from '../controllers/feeController.js';

const router = express.Router();
router.use(protect);
router.get('/structures', authorize('admin'), getFeeStructures);
router.post('/structures', authorize('admin'), createFeeStructure);
router.put('/structures/:id', authorize('admin'), updateFeeStructure);
router.get('/invoices', authorize('admin', 'guardian'), getInvoices);
router.post('/invoices', authorize('admin'), createInvoice);
router.get('/invoices/:id/payments', authorize('admin', 'guardian'), getPayments);
router.post('/invoices/:id/payments', authorize('admin'), recordPayment);
router.get('/payments/:paymentId/receipt', authorize('admin', 'guardian'), getReceipt);
router.get('/stats', authorize('admin'), getFeeStats);
export default router;
