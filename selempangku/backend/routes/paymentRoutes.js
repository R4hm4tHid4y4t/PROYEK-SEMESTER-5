const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, adminOnly, verifiedOnly } = require('../middleware/authMiddleware');
const { uploadPayment } = require('../middleware/uploadMiddleware');
const { paymentValidation } = require('../middleware/validationMiddleware');

router.post('/', protect, verifiedOnly, uploadPayment.single('payment_proof'), paymentValidation, paymentController.createPayment);
router.get('/my-payments', protect, paymentController.getMyPayments);
router.get('/order/:orderId', protect, paymentController.getPaymentsByOrderId);
router.get('/:id', protect, paymentController.getPaymentById);

router.get('/', protect, adminOnly, paymentController.getAllPayments);
router.put('/:id/verify', protect, adminOnly, paymentController.verifyPayment);
router.put('/:id/reject', protect, adminOnly, paymentController.rejectPayment);

module.exports = router;
