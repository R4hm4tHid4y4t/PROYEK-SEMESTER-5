const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

exports.getDashboardStats = async (req, res) => {
  try {
    const orderStats = await Order.getStatistics();
    const members = await User.getAllMembers();
    const products = await Product.findAll();

    res.json({
      statistics: {
        ...orderStats,
        totalMembers: members.length,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    const salesData = await Order.getSalesData(period);
    const orders = await Order.findAll({ startDate, endDate, status: 'Selesai' });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const totalOrders = orders.length;

    res.json({
      salesData,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      transactions: orders
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const orders = await Order.findAll(filters);
    res.json({ transactions: orders });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getSalesChartData = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const salesData = await Order.getSalesData(period);
    res.json({ chartData: salesData });
  } catch (error) {
    console.error('Get sales chart data error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
