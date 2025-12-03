const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, phone, address } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, address, otp_code, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, address || null, otp, otpExpiry]
    );
    return { id: result.insertId, otp };
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT id, name, email, phone, address, role, is_verified, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async verifyOTP(email, otp) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()',
      [email, otp]
    );
    if (rows[0]) {
      await pool.execute('UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = ?', [rows[0].id]);
      return true;
    }
    return false;
  }

  static async updateOTP(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await pool.execute('UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?', [otp, otpExpiry, email]);
    return otp;
  }

  static async setResetToken(email) {
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await pool.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetTokenExpiry, email]);
    return resetToken;
  }

  static async findByResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    return rows[0];
  }

  static async resetPassword(token, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
      [hashedPassword, token]
    );
    return result.affectedRows > 0;
  }

  static async updateProfile(id, userData) {
    const { name, phone, address } = userData;
    await pool.execute('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, id]);
    return this.findById(id);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllMembers() {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, address, is_verified, created_at FROM users WHERE role = "user" ORDER BY created_at DESC'
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ? AND role = "user"', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;
