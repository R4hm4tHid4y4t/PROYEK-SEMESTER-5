const { pool } = require('../config/database');

class Order {
  static async create(orderData) {
    const { user_id, product_id, quantity, total_price, notes } = orderData;
    const [result] = await pool.execute(
      'INSERT INTO orders (user_id, product_id, quantity, total_price, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, product_id, quantity, total_price, notes || null]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT o.*, p.name as product_name, p.image as product_image, p.price as product_price,
             u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(`
      SELECT o.*, p.name as product_name, p.image as product_image, p.price as product_price
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);
    return rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, p.name as product_name, p.image as product_image,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.startDate) {
      query += ' AND DATE(o.created_at) >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND DATE(o.created_at) <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async updateStatus(id, status) {
    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async getStatistics() {
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "Menunggu Pembayaran"');
    const [completedOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "Selesai"');
    const [totalRevenue] = await pool.execute('SELECT SUM(total_price) as total FROM orders WHERE status = "Selesai"');

    return {
      totalOrders: totalOrders[0].count,
      pendingOrders: pendingOrders[0].count,
      completedOrders: completedOrders[0].count,
      totalRevenue: totalRevenue[0].total || 0
    };
  }

  static async getRecentOrders(limit = 5) {
    const [rows] = await pool.execute(`
      SELECT o.*, p.name as product_name, u.name as user_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  static async getSalesData(period = 'monthly') {
    let query;
    if (period === 'daily') {
      query = `
        SELECT DATE(created_at) as date, SUM(total_price) as total, COUNT(*) as count
        FROM orders WHERE status = 'Selesai'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    } else {
      query = `
        SELECT DATE_FORMAT(created_at, '%Y-%m') as date, SUM(total_price) as total, COUNT(*) as count
        FROM orders WHERE status = 'Selesai'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY date
      `;
    }
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = Order;
