const { pool } = require('../config/database');

class Account {
  static async create(accountData) {
    const { bank_name, account_number, account_holder } = accountData;
    const [result] = await pool.execute(
      'INSERT INTO accounts (bank_name, account_number, account_holder) VALUES (?, ?, ?)',
      [bank_name, account_number, account_holder]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [id]);
    return rows[0];
  }

  static async findAll(activeOnly = false) {
    let query = 'SELECT * FROM accounts';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async update(id, accountData) {
    const { bank_name, account_number, account_holder, is_active } = accountData;
    await pool.execute(
      'UPDATE accounts SET bank_name = ?, account_number = ?, account_holder = ?, is_active = ? WHERE id = ?',
      [bank_name, account_number, account_holder, is_active, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM accounts WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async toggleActive(id) {
    await pool.execute('UPDATE accounts SET is_active = NOT is_active WHERE id = ?', [id]);
    return this.findById(id);
  }
}

module.exports = Account;
