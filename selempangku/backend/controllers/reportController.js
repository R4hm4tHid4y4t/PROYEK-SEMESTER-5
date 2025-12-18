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

// --- FUNGSI SALES REPORT (UPDATED) ---
exports.getSalesReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    // PERBAIKAN: Kirim startDate dan endDate ke model agar grafik akurat
    const salesData = await Order.getSalesData(period, startDate, endDate);
    
    // Filter orders untuk tabel detail transaksi
    const filters = { status: 'Selesai' };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const orders = await Order.findAll(filters);

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

// --- FUNGSI CHART DATA (UPDATED) ---
exports.getSalesChartData = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    // PERBAIKAN: Kirim startDate dan endDate ke model
    const salesData = await Order.getSalesData(period, startDate, endDate);
    
    res.json({ chartData: salesData });
  } catch (error) {
    console.error('Get sales chart data error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// --- FUNGSI EXPORT (SUDAH FIX) ---
exports.exportReport = async (req, res) => {
  try {
    const { format, period, startDate, endDate } = req.query;
    
    // 1. SETUP FILTER
    let filters = { status: 'Selesai' };
    let periodText = '';

    // Logika Filter
    if (period === 'daily') {
        filters.startDate = new Date().toISOString().split('T')[0];
        periodText = `Harian (${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })})`;
    } else if (period === 'monthly') {
        const date = new Date();
        filters.startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        periodText = `Bulanan (${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'custom') {
        // Validasi Custom Date
        if (!startDate && !endDate) {
            return res.status(400).json({ message: 'Harap pilih rentang tanggal.' });
        }
        filters.startDate = startDate;
        filters.endDate = endDate;
        
        const startStr = startDate ? new Date(startDate).toLocaleDateString('id-ID') : '...';
        const endStr = endDate ? new Date(endDate).toLocaleDateString('id-ID') : '...';
        periodText = `Custom (${startStr} - ${endStr})`;
    } else {
        periodText = 'Semua Periode';
    }

    // Eksekusi Query
    const orders = await Order.findAll(filters);

    // 2. VALIDASI DATA KOSONG
    if (!orders || orders.length === 0) {
        return res.status(404).json({ message: 'Data tidak ditemukan untuk periode yang dipilih. Laporan tidak dapat diexport.' });
    }

    // 3. AMBIL DATA USER (PENANDA TANGAN) DARI DB
    let signerName = 'Administrator';
    let signerRole = 'Admin';

    if (req.user && req.user.id) {
        try {
            const currentUser = await User.findById(req.user.id);
            if (currentUser) {
                signerName = currentUser.name || 'Administrator';
                const rawRole = currentUser.role || 'Admin';
                signerRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
            }
        } catch (err) {
            console.warn('Gagal mengambil data signer:', err.message);
        }
    }

    // 4. GENERATE FILE (Excel / PDF)
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

      // --- HEADER PDF ---
      doc.fillColor('#1F2937')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('LAPORAN PENJUALAN', { align: 'center' })
         .fontSize(10)
         .font('Helvetica')
         .text('SelempangKu Official Store', { align: 'center' })
         .moveDown();

      doc.fontSize(10)
         .text(`Periode Laporan : ${periodText}`, { align: 'left' })
         .text(`Dicetak Pada    : ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB`, { align: 'left' })
         .moveDown();

      // --- TABEL SETUP ---
      const tableTop = 160;
      const colID = 50;
      const colDate = 100;
      const colCustomer = 200;
      const colProduct = 320;
      const colTotal = 450;

      let position = tableTop;

      const generateHr = (y) => {
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
      };

      const generateTableRow = (y, id, date, customer, product, total, isHeader = false) => {
        const yPos = isHeader ? y : y - 4;
        doc.fontSize(isHeader ? 9 : 8)
           .text(id, colID, y)
           .text(date, colDate, y, { width: 90 })
           .text(customer, colCustomer, y, { width: 110 })
           .text(product, colProduct, yPos, { width: 120 }) 
           .text(total, colTotal, y, { width: 100, align: 'right' });
      };

      // Header Tabel
      doc.font('Helvetica-Bold').fillColor('#111827');
      generateTableRow(position, 'ID', 'Tanggal', 'Pelanggan', 'Produk', 'Total (Rp)', true);
      doc.strokeColor('#4B5563').lineWidth(1.5).moveTo(50, position + 15).lineTo(550, position + 15).stroke();
      position += 30;

      // Isi Data
      doc.font('Helvetica').fillColor('#374151');
      let totalRevenue = 0;

      orders.forEach((order) => {
        if (position > 700) {
           doc.addPage();
           position = 50;
           doc.font('Helvetica-Bold');
           generateTableRow(position, 'ID', 'Tanggal', 'Pelanggan', 'Produk', 'Total (Rp)', true);
           doc.strokeColor('#4B5563').lineWidth(1.5).moveTo(50, position + 15).lineTo(550, position + 15).stroke();
           position += 30;
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
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
      doc.text('TOTAL PENDAPATAN:', colProduct, position, { width: 120, align: 'right' });
      doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, colTotal, position, { width: 100, align: 'right' });

      // --- FOOTER & TANDA TANGAN DINAMIS ---
      if (position > 600) {
        doc.addPage();
        position = 50;
      } else {
        position += 60;
      }

      const leftColX = 50;
      const rightColX = 350;
      
      const dateString = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
      });

      // Kolom Kiri
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6B7280');
      doc.text('Catatan:', leftColX, position);
      doc.text('1. Laporan ini digenerate secara otomatis oleh sistem.', leftColX, position + 12);
      doc.text('2. Harap periksa kembali kesesuaian data fisik.', leftColX, position + 24);

      // Kolom Kanan
      doc.fontSize(10).font('Helvetica').fillColor('#111827');
      doc.text(`Jakarta, ${dateString}`, rightColX, position);
      
      doc.moveDown(0.2);
      doc.text('Yang Mengesahkan,', rightColX, doc.y);
      
      doc.moveDown(4); 
      const currentY = doc.y;

      // Nama Penanda Tangan (Dinamis)
      doc.font('Helvetica-Bold').text(signerName, rightColX, currentY);
      
      const nameWidth = doc.widthOfString(signerName);
      doc.strokeColor('#111827').lineWidth(1)
         .moveTo(rightColX, currentY + 12)
         .lineTo(rightColX + nameWidth, currentY + 12)
         .stroke();

      // Jabatan (Dinamis)
      doc.fontSize(9).font('Helvetica').text(signerRole, rightColX, currentY + 16);

      // Nomor Halaman
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9CA3AF').text(
          `Halaman ${i + 1} dari ${pageCount}`,
          50,
          doc.page.height - 30,
          { align: 'center' }
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