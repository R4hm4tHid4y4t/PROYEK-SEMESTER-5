const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { accountValidation } = require('../middleware/validationMiddleware');

router.get('/active', protect, accountController.getActiveAccounts);

router.get('/', protect, adminOnly, accountController.getAllAccounts);
router.get('/:id', protect, adminOnly, accountController.getAccountById);
router.post('/', protect, adminOnly, accountValidation, accountController.createAccount);
router.put('/:id', protect, adminOnly, accountController.updateAccount);
router.delete('/:id', protect, adminOnly, accountController.deleteAccount);
router.put('/:id/toggle', protect, adminOnly, accountController.toggleAccountStatus);

module.exports = router;
