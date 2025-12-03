const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendPaymentStatusEmail } = require('../config/email');

exports.createPayment = async (req, res) => {
  try {
    const { order_id, account_id } = req.body;
    const user_id = req.user.id;

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    if (order.user_id !== user_id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    if (order.status !== 'Menunggu Pembayaran') {
      return res.status(400).json({ message: 'Pesanan sudah dibayar atau tidak valid.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Bukti pembayaran harus diupload.' });
    }

    const payment = await Payment.create({
      order_id,
      user_id,
      account_id,
      amount: order.total_price,
      payment_proof: req.file.filename
    });

    await Order.updateStatus(order_id, 'Menunggu Verifikasi');

    res.status(201).json({ message: 'Bukti pembayaran berhasil diupload.', payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.findByUserId(req.user.id);
    res.json({ payments });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getPaymentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const payments = await Payment.findByOrderId(orderId);
    res.json({ payments });
  } catch (error) {
    console.error('Get payments by order id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const payments = await Payment.findAll(filters);
    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan.' });
    }

    if (payment.status !== 'Menunggu Verifikasi') {
      return res.status(400).json({ message: 'Pembayaran sudah diproses.' });
    }

    const updatedPayment = await Payment.updateStatus(id, 'Verifikasi');
    await Order.updateStatus(payment.order_id, 'Proses Produksi');

    const user = await User.findById(payment.user_id);
    await sendPaymentStatusEmail(user.email, 'Verifikasi', { id: payment.order_id }, user.name);

    res.json({ message: 'Pembayaran berhasil diverifikasi.', payment: updatedPayment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Pembayaran tidak ditemukan.' });
    }

    if (payment.status !== 'Menunggu Verifikasi') {
      return res.status(400).json({ message: 'Pembayaran sudah diproses.' });
    }

    const updatedPayment = await Payment.updateStatus(id, 'Ditolak', notes);
    await Order.updateStatus(payment.order_id, 'Menunggu Pembayaran');

    const user = await User.findById(payment.user_id);
    await sendPaymentStatusEmail(user.email, 'Ditolak', { id: payment.order_id }, user.name, notes);

    res.json({ message: 'Pembayaran ditolak.', payment: updatedPayment });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
