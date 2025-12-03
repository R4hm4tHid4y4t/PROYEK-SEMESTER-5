const { pool } = require('../config/database');

class Product {
  static async create(productData) {
    const { name, description, price, image, stock, category } = productData;
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, image, stock, category) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, price, image || null, stock || 0, category || null]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, productData) {
    const { name, description, price, image, stock, category, is_active } = productData;
    
    let query = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, is_active = ?';
    const params = [name, description, price, stock, category, is_active];

    if (image) {
      query += ', image = ?';
      params.push(image);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async updateStock(id, quantity) {
    await pool.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, id]);
  }

  static async getCategories() {
    const [rows] = await pool.execute('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
    return rows.map(row => row.category);
  }
}

module.exports = Product;
