const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, adminOnly, reportController.getDashboardStats);
router.get('/sales', protect, adminOnly, reportController.getSalesReport);
router.get('/transactions', protect, adminOnly, reportController.getTransactionHistory);
router.get('/chart', protect, adminOnly, reportController.getSalesChartData);
router.get('/export', protect, adminOnly, reportController.exportReport);

module.exports = router;