import express from 'express';
import { MonitoringController } from '../controller/monitoringController'; // Pastikan path ke monitoringController benar

const router = express.Router();

const monitoringController = new MonitoringController();

// Define route untuk monitoring data berdasarkan UUID
router.get('/monitoring/:uuid', async (req, res) => {
  await monitoringController.handlerMonitoring(req, res);
});

export default router;
