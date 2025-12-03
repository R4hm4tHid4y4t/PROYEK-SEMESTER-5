const { pool } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const { order_id, user_id, account_id, amount, payment_proof } = paymentData;
    const [result] = await pool.execute(
      'INSERT INTO payments (order_id, user_id, account_id, amount, payment_proof) VALUES (?, ?, ?, ?, ?)',
      [order_id, user_id, account_id, amount, payment_proof]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT p.*, o.product_id, o.quantity, o.total_price as order_total, o.status as order_status,
             a.bank_name, a.account_number, a.account_holder,
             u.name as user_name, u.email as user_email,
             pr.name as product_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN accounts a ON p.account_id = a.id
      JOIN users u ON p.user_id = u.id
      JOIN products pr ON o.product_id = pr.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async findByOrderId(orderId) {
    const [rows] = await pool.execute(`
      SELECT p.*, a.bank_name, a.account_number, a.account_holder
      FROM payments p
      JOIN accounts a ON p.account_id = a.id
      WHERE p.order_id = ?
      ORDER BY p.created_at DESC
    `, [orderId]);
    return rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT p.*, o.total_price as order_total, o.status as order_status,
             a.bank_name, a.account_number, a.account_holder,
             u.name as user_name, u.email as user_email,
             pr.name as product_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN accounts a ON p.account_id = a.id
      JOIN users u ON p.user_id = u.id
      JOIN products pr ON o.product_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async updateStatus(id, status, verificationNotes = null) {
    await pool.execute(
      'UPDATE payments SET status = ?, verification_notes = ? WHERE id = ?',
      [status, verificationNotes, id]
    );
    return this.findById(id);
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(`
      SELECT p.*, o.total_price as order_total, o.status as order_status,
             a.bank_name, a.account_number, a.account_holder,
             pr.name as product_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN accounts a ON p.account_id = a.id
      JOIN products pr ON o.product_id = pr.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
    return rows;
  }
}

module.exports = Payment;
