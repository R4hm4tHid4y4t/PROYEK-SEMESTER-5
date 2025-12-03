const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../config/email');

exports.createOrder = async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;
    const user_id = req.user.id;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    if (!product.is_active) {
      return res.status(400).json({ message: 'Produk tidak tersedia.' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Stok tidak mencukupi.' });
    }

    const total_price = product.price * quantity;
    const order = await Order.create({ user_id, product_id, quantity, total_price, notes });
    
    await Product.updateStock(product_id, quantity);

    const user = await User.findById(user_id);
    await sendOrderConfirmationEmail(user.email, { ...order, product_name: product.name }, user.name);

    res.status(201).json({ message: 'Pesanan berhasil dibuat.', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findByUserId(req.user.id);
    res.json({ orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const orders = await Order.findAll(filters);
    res.json({ orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Proses Produksi', 'Dalam Pengiriman', 'Selesai', 'Ditolak'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    const updatedOrder = await Order.updateStatus(id, status);

    const user = await User.findById(order.user_id);
    await sendOrderStatusEmail(user.email, status, order, user.name);

    res.json({ message: 'Status pesanan berhasil diperbarui.', order: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const statistics = await Order.getStatistics();
    res.json({ statistics });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.getRecentOrders(5);
    res.json({ orders });
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
