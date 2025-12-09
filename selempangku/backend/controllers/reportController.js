const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const excelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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

// --- FUNGSI EXPORT (UPDATED) ---
exports.exportReport = async (req, res) => {
  try {
    const { format, period, startDate, endDate } = req.query;
    
    let filters = { status: 'Selesai' };
    let periodText = '';

    // Logika Filter & Text Periode
    if (period === 'daily') {
        filters.startDate = new Date().toISOString().split('T')[0];
        periodText = `Harian (${new Date().toLocaleDateString('id-ID')})`;
    } else if (period === 'monthly') {
        const date = new Date();
        filters.startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        periodText = `Bulanan (${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'custom' && startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
        periodText = `Custom (${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')})`;
    } else {
        periodText = 'Semua Periode';
    }

    const orders = await Order.findAll(filters);

    if (format === 'excel') {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Penjualan');

      worksheet.columns = [
        { header: 'Order ID', key: 'id', width: 10 },
        { header: 'Tanggal', key: 'date', width: 20 },
        { header: 'Pelanggan', key: 'customer', width: 25 },
        { header: 'Produk', key: 'product', width: 30 },
        { header: 'Qty', key: 'quantity', width: 8 },
        { header: 'Total (Rp)', key: 'total', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };

      orders.forEach(order => {
        worksheet.addRow({
          id: order.id,
          date: new Date(order.created_at).toLocaleString('id-ID'),
          customer: order.user_name,
          product: order.product_name,
          quantity: order.quantity,
          total: parseFloat(order.total_price),
          status: order.status
        });
      });

      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      worksheet.addRow([]);
      const totalRow = worksheet.addRow(['', '', '', '', 'TOTAL PENDAPATAN', totalRevenue]);
      totalRow.font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-penjualan.xlsx');

      await workbook.xlsx.write(res);
      res.end();

    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=laporan-penjualan.pdf');

      doc.pipe(res);

      // Header PDF
      doc.fillColor('#444444')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('LAPORAN PENJUALAN', { align: 'center' })
         .fontSize(10)
         .font('Helvetica')
         .text('SelempangKu Official Store', { align: 'center' })
         .moveDown();

      doc.fontSize(10)
         .text(`Periode: ${periodText}`, { align: 'left' })
         .text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, { align: 'left' })
         .moveDown();

      // Setup Tabel
      const tableTop = 150;
      const colID = 50;
      const colDate = 100;
      const colCustomer = 200;
      const colProduct = 320;
      const colTotal = 450;

      let position = tableTop;

      const generateHr = (y) => {
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
      };

      // --- PERBAIKAN DI SINI ---
      // Fungsi generateTableRow diperbarui untuk menaikkan teks kolom produk
      const generateTableRow = (y, id, date, customer, product, total) => {
        doc.fontSize(9)
           .text(id, colID, y)
           .text(date, colDate, y, { width: 90 })
           .text(customer, colCustomer, y, { width: 110 })
           // PERHATIKAN: 'y - 4' digunakan di sini untuk menaikkan teks Produk
           .text(product, colProduct, y - 4, { width: 120 }) 
           .text(total, colTotal, y, { width: 100, align: 'right' });
      };

      // Header Tabel
      doc.font('Helvetica-Bold');
      generateTableRow(position, 'ID', 'Tanggal', 'Pelanggan', 'Produk', 'Total (Rp)');
      generateHr(position + 15);
      position += 25;

      // Isi Data
      doc.font('Helvetica');
      let totalRevenue = 0;

      orders.forEach((order) => {
        if (position > 700) {
           doc.addPage();
           position = 50;
           doc.font('Helvetica-Bold');
           generateTableRow(position, 'ID', 'Tanggal', 'Pelanggan', 'Produk', 'Total (Rp)');
           generateHr(position + 15);
           position += 25;
           doc.font('Helvetica');
        }

        const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID');
        const formattedTotal = parseFloat(order.total_price).toLocaleString('id-ID');
        
        generateTableRow(
          position, 
          `#${order.id}`, 
          formattedDate, 
          order.user_name, 
          order.product_name, 
          formattedTotal
        );
        
        generateHr(position + 15);
        totalRevenue += parseFloat(order.total_price);
        position += 25;
      });

      // Total Summary
      position += 10;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('TOTAL PENDAPATAN:', colProduct, position, { width: 120, align: 'right' });
      doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, colTotal, position, { width: 100, align: 'right' });

      // Footer Halaman
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Halaman ${i + 1} dari ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center', color: '#aaaaaa' }
        );
      }

      doc.end();

    } else {
      res.status(400).json({ message: 'Format tidak didukung' });
    }

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Gagal mengexport laporan.' });
  }
};