const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { profileValidation } = require('../middleware/validationMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, profileValidation, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);

router.get('/members', protect, adminOnly, userController.getAllMembers);
router.delete('/members/:id', protect, adminOnly, userController.deleteMember);

module.exports = router;
