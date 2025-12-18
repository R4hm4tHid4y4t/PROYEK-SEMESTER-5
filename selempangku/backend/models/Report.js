const { pool } = require('../config/database');

class Report {
  // Simpan Log Laporan Baru
  static async create(reportData) {
    const { reportNumber, month, year, sequence, generatedBy, type } = reportData;
    
    // Menggunakan query SQL manual karena tidak pakai Sequelize
    const [result] = await pool.execute(
      `INSERT INTO reports (report_number, month, year, sequence, generated_by, type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reportNumber, month, year, sequence, generatedBy || null, type || 'SALES']
    );
    return result.insertId;
  }

  // Cari urutan terakhir di bulan & tahun tertentu untuk penomoran otomatis
  static async findLastByMonthYear(month, year) {
    const [rows] = await pool.execute(
      `SELECT * FROM reports 
       WHERE month = ? AND year = ? 
       ORDER BY sequence DESC 
       LIMIT 1`,
      [month, year]
    );
    return rows[0];
  }
}

module.exports = Report;