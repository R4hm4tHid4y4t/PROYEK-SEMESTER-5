const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly, verifiedOnly } = require('../middleware/authMiddleware');
const { orderValidation } = require('../middleware/validationMiddleware');

router.post('/', protect, verifiedOnly, orderValidation, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/statistics', protect, adminOnly, orderController.getOrderStatistics);
router.get('/recent', protect, adminOnly, orderController.getRecentOrders);
router.get('/:id', protect, orderController.getOrderById);

router.get('/', protect, adminOnly, orderController.getAllOrders);
router.put('/:id/status', protect, adminOnly, orderController.updateOrderStatus);

module.exports = router;
