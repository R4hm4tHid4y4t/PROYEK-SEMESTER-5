const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../middleware/uploadMiddleware');
const { productValidation } = require('../middleware/validationMiddleware');

router.get('/public', productController.getActiveProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

router.get('/', protect, adminOnly, productController.getAllProducts);
router.post('/', protect, adminOnly, uploadProduct.single('image'), productValidation, productController.createProduct);
router.put('/:id', protect, adminOnly, uploadProduct.single('image'), productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
