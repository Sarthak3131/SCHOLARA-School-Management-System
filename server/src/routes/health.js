import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'SCHOLARA API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
