import express from 'express';
import * as importController from '../controllers/importController.js';
import * as imageController from '../controllers/imageController.js';

const router = express.Router();

// ==================== Import Routes ====================
router.post('/import/google-drive', importController.importFromGoogleDrive);
router.post('/import/dropbox', importController.importFromDropbox); // Bonus

// ==================== Image Routes ====================
router.get('/images', imageController.getAllImages);
router.get('/images/:id', imageController.getImageById);
router.delete('/images/:id', imageController.deleteImage);
router.post('/images/sync', imageController.syncImages);

// ==================== Job Status Routes ====================
router.get('/jobs/:jobId', imageController.getJobStatus);

// ==================== Statistics Routes ====================
router.get('/stats', imageController.getStats);

// ==================== Health Check ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'healthy',
  });
});

export default router;
