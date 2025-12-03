const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Nama harus diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor telepon tidak valid'),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi'),
  handleValidationErrors
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Nama produk harus diisi'),
  body('price').isNumeric().withMessage('Harga harus berupa angka'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stok harus berupa angka positif'),
  handleValidationErrors
];

const orderValidation = [
  body('product_id').isInt().withMessage('ID produk tidak valid'),
  body('quantity').isInt({ min: 1 }).withMessage('Jumlah minimal 1'),
  handleValidationErrors
];

const paymentValidation = [
  body('order_id').isInt().withMessage('ID pesanan tidak valid'),
  body('account_id').isInt().withMessage('ID rekening tidak valid'),
  handleValidationErrors
];

const accountValidation = [
  body('bank_name').trim().notEmpty().withMessage('Nama bank harus diisi'),
  body('account_number').trim().notEmpty().withMessage('Nomor rekening harus diisi'),
  body('account_holder').trim().notEmpty().withMessage('Nama pemilik rekening harus diisi'),
  handleValidationErrors
];

const profileValidation = [
  body('name').trim().notEmpty().withMessage('Nama harus diisi'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor telepon tidak valid'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  orderValidation,
  paymentValidation,
  accountValidation,
  profileValidation,
  handleValidationErrors
};
