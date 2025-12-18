const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report'); // Model Report versi MySQL2
const excelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// --- HELPER FUNCTIONS ---

const getRomanMonth = (monthIndex) => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return roman[monthIndex];
};

const generateReportNumber = async (month, year) => {
    const lastReport = await Report.findLastByMonthYear(month, year);
    const nextSequence = lastReport ? lastReport.sequence + 1 : 1;
    const sequenceString = nextSequence.toString().padStart(3, '0');
    const monthRoman = getRomanMonth(month - 1); 

    return {
        fullNumber: `LPJ/${monthRoman}/${year}/${sequenceString}`,
        sequence: nextSequence
    };
};

// --- CONTROLLER FUNCTIONS ---

exports.getDashboardStats = async (req, res) => {
  try {
    const orderStats = await Order.getStatistics();
    const users = User.findAll ? await User.findAll() : (User.getAllMembers ? await User.getAllMembers() : []);
    const products = Product.findAll ? await Product.findAll() : [];

    res.json({
      statistics: {
        ...orderStats,
        totalMembers: users.length || 0,
        totalProducts: products.length || 0,
        activeProducts: products.filter ? products.filter(p => p.is_active).length : 0
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
    const salesData = await Order.getSalesData(period, startDate, endDate);
    
    const filters = { status: 'Selesai' };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const orders = await Order.findAll(filters);

    let totalRevenue = 0;
    let totalOrders = 0;

    if (orders && orders.length > 0) {
        totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
        totalOrders = orders.length;
    }

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
    const { period = 'monthly', startDate, endDate } = req.query;
    const salesData = await Order.getSalesData(period, startDate, endDate);
    res.json({ chartData: salesData });
  } catch (error) {
    console.error('Get sales chart data error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// --- FUNGSI EXPORT LENGKAP (VISUALLY CENTERED) ---
exports.exportReport = async (req, res) => {
  try {
    const { format, period, startDate, endDate } = req.query;
    
    let filters = { status: 'Selesai' };
    let periodText = '';

    if (period === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        filters.startDate = today;
        filters.endDate = today;
        periodText = `Harian (${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })})`;
    } else if (period === 'monthly') {
        const date = new Date();
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const toDateStr = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        filters.startDate = toDateStr(start);
        filters.endDate = toDateStr(end);
        periodText = `Bulanan (${date.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'custom') {
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

    const orders = await Order.findAll(filters);

    if (!orders || orders.length === 0) {
        return res.status(404).json({ message: 'Data tidak ditemukan.' });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const numberData = await generateReportNumber(currentMonth, currentYear);

    await Report.create({
        reportNumber: numberData.fullNumber,
        month: currentMonth,
        year: currentYear,
        sequence: numberData.sequence,
        generatedBy: req.user ? req.user.id : null,
        type: 'SALES'
    });

    const finalReportNumber = numberData.fullNumber;

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
        } catch (err) { }
    }

    // --- 5A. EXPORT EXCEL (VISUALLY CENTERED) ---
    if (format === 'excel') {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Penjualan');

      // Tampilan Bersih (Hilangkan Gridlines Excel)
      worksheet.views = [
        { showGridLines: false }
      ];

      // Page Setup (Print Centered)
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'portrait',
        horizontalCentered: true, // Print di tengah
        fitToPage: true,
        margins: {
            left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
            header: 0.3, footer: 0.3
        }
      };

      // --- STRUKTUR KOLOM DENGAN SPACER ---
      // Kolom A = Margin/Spacer (Kosong)
      // Kolom B-G = Data
      worksheet.columns = [
        { key: 'margin', width: 5 },    // A: Spacer agar tidak nempel kiri
        { key: 'id', width: 12 },       // B: ID
        { key: 'date', width: 15 },     // C: Date
        { key: 'customer', width: 25 }, // D: Customer
        { key: 'product', width: 50 },  // E: Product
        { key: 'quantity', width: 10 }, // F: Qty
        { key: 'total', width: 25 }     // G: Total
      ];

      const startCol = 'B';
      const endCol = 'G';
      const fontName = 'Arial'; 
      const darkColor = 'FF1F2937';
      const blueColor = 'FF1E40AF';

      // --- HEADER DOKUMEN ---
      
      // Judul
      worksheet.mergeCells(`${startCol}1:${endCol}1`);
      worksheet.getCell(`${startCol}1`).value = 'LAPORAN PENJUALAN';
      worksheet.getCell(`${startCol}1`).font = { size: 16, bold: true, name: fontName, color: { argb: darkColor } };
      worksheet.getCell(`${startCol}1`).alignment = { horizontal: 'center', vertical: 'middle' };

      // Sub Judul
      worksheet.mergeCells(`${startCol}2:${endCol}2`);
      worksheet.getCell(`${startCol}2`).value = 'SelempangKu Official Store';
      worksheet.getCell(`${startCol}2`).font = { size: 10, name: fontName, color: { argb: darkColor } };
      worksheet.getCell(`${startCol}2`).alignment = { horizontal: 'center', vertical: 'middle' };

      // Nomor Dokumen
      worksheet.mergeCells(`${startCol}3:${endCol}3`);
      worksheet.getCell(`${startCol}3`).value = `No: ${finalReportNumber}`;
      worksheet.getCell(`${startCol}3`).font = { size: 11, bold: true, color: { argb: blueColor }, name: fontName }; 
      worksheet.getCell(`${startCol}3`).alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow([]); 

      // Periode (Left Aligned di Kolom B)
      worksheet.mergeCells(`${startCol}5:${endCol}5`);
      worksheet.getCell(`${startCol}5`).value = `Periode Laporan : ${periodText}`;
      worksheet.getCell(`${startCol}5`).font = { size: 10, name: fontName, color: { argb: darkColor } };
      worksheet.getCell(`${startCol}5`).alignment = { horizontal: 'left', vertical: 'middle', indent: 0 };

      // Tanggal Cetak
      const printDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB';
      worksheet.mergeCells(`${startCol}6:${endCol}6`);
      worksheet.getCell(`${startCol}6`).value = `Dicetak Pada      : ${printDate}`;
      worksheet.getCell(`${startCol}6`).font = { size: 10, name: fontName, color: { argb: darkColor } };
      worksheet.getCell(`${startCol}6`).alignment = { horizontal: 'left', vertical: 'middle', indent: 0 };

      worksheet.addRow([]); 

      // --- HEADER TABEL (Row 8) ---
      // Karena ada kolom margin (A), kita harus set values manual ke B-G
      const headerRow = worksheet.getRow(8);
      // Kolom A kosong, mulai isi dari index 2 (B)
      headerRow.getCell(2).value = 'Order ID';
      headerRow.getCell(3).value = 'Tanggal';
      headerRow.getCell(4).value = 'Pelanggan';
      headerRow.getCell(5).value = 'Produk';
      headerRow.getCell(6).value = 'Qty';
      headerRow.getCell(7).value = 'Total (Rp)';
      headerRow.height = 25; 

      // Styling Header (Cell 2 sampai 7)
      for (let i = 2; i <= 7; i++) {
        const cell = headerRow.getCell(i);
        cell.font = { bold: true, name: fontName, size: 9, color: { argb: darkColor } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' } 
        };
        cell.border = { 
            top: { style: 'thin', color: { argb: 'FF374151' } }, 
            left: { style: 'thin', color: { argb: 'FF374151' } }, 
            bottom: { style: 'thin', color: { argb: 'FF374151' } }, 
            right: { style: 'thin', color: { argb: 'FF374151' } } 
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // --- ISI DATA ---
      orders.forEach(order => {
        // Add row akan mengisi sesuai key columns. 'margin' key tidak diisi data, jadi kosong (A).
        const row = worksheet.addRow({
          id: `#${order.id}`,
          date: new Date(order.created_at).toLocaleString('id-ID'),
          customer: order.user_name || order.User?.name || 'Guest',
          product: order.product_name || order.Product?.name || 'Item',
          quantity: order.quantity || 1,
          total: parseFloat(order.total_price)
        });

        // Styling Cell B-G (Index 2-7)
        for (let colNumber = 2; colNumber <= 7; colNumber++) {
            const cell = row.getCell(colNumber);
            cell.font = { name: fontName, size: 9, color: { argb: 'FF374151' } };
            cell.border = { 
                top: { style: 'thin', color: { argb: 'FF374151' } }, 
                left: { style: 'thin', color: { argb: 'FF374151' } }, 
                bottom: { style: 'thin', color: { argb: 'FF374151' } }, 
                right: { style: 'thin', color: { argb: 'FF374151' } } 
            };
            
            // Alignment
            if (colNumber === 2 || colNumber === 6) { // ID(B) & Qty(F) -> Center
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } 
            else if (colNumber === 7) { // Total(G) -> Right
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.numFmt = '#,##0'; 
            } 
            else { // Others -> Left
                cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
            }
        }
      });

      // --- TOTAL ROW ---
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      
      // Tambah row kosong dulu baru isi manual agar presisi
      const totalRow = worksheet.addRow([]);
      
      // Merge Label Total (B-F)
      worksheet.mergeCells(`B${totalRow.number}:F${totalRow.number}`);
      const labelCell = worksheet.getCell(`B${totalRow.number}`);
      labelCell.value = 'TOTAL PENDAPATAN';
      labelCell.alignment = { vertical: 'middle', horizontal: 'right' };
      labelCell.font = { bold: true, name: fontName, size: 10 };
      labelCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // Value Total (G)
      const valueCell = worksheet.getCell(`G${totalRow.number}`);
      valueCell.value = totalRevenue;
      valueCell.alignment = { vertical: 'middle', horizontal: 'right' };
      valueCell.font = { bold: true, name: fontName, size: 10 };
      valueCell.numFmt = '#,##0';
      valueCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // --- FOOTER & SIGNER ---
      worksheet.addRow([]); 
      worksheet.addRow([]);

      const footerStartRow = totalRow.number + 3;
      
      // Catatan (Kiri - B)
      const noteStyle = { italic: true, size: 8, color: { argb: 'FF6B7280' }, name: fontName };
      
      worksheet.getCell(`B${footerStartRow}`).value = 'Catatan:';
      worksheet.getCell(`B${footerStartRow}`).font = noteStyle;
      
      worksheet.getCell(`B${footerStartRow + 1}`).value = `1. No Laporan: ${finalReportNumber}`;
      worksheet.getCell(`B${footerStartRow + 1}`).font = noteStyle;
      
      worksheet.getCell(`B${footerStartRow + 2}`).value = '2. Harap periksa kembali kesesuaian data fisik.';
      worksheet.getCell(`B${footerStartRow + 2}`).font = noteStyle;

      // Tanda Tangan (Kanan - F-G)
      const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const signStyle = { size: 10, color: { argb: darkColor }, name: fontName };

      worksheet.mergeCells(`F${footerStartRow}:G${footerStartRow}`);
      worksheet.getCell(`F${footerStartRow}`).value = `Padang, ${dateString}`;
      worksheet.getCell(`F${footerStartRow}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`F${footerStartRow}`).font = signStyle;

      worksheet.mergeCells(`F${footerStartRow + 1}:G${footerStartRow + 1}`);
      worksheet.getCell(`F${footerStartRow + 1}`).value = 'Yang Mengesahkan,';
      worksheet.getCell(`F${footerStartRow + 1}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`F${footerStartRow + 1}`).font = signStyle;

      const nameRow = footerStartRow + 5;
      worksheet.mergeCells(`F${nameRow}:G${nameRow}`);
      worksheet.getCell(`F${nameRow}`).value = signerName;
      worksheet.getCell(`F${nameRow}`).font = { bold: true, underline: true, name: fontName, size: 10, color: { argb: darkColor } };
      worksheet.getCell(`F${nameRow}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`F${nameRow + 1}:G${nameRow + 1}`);
      worksheet.getCell(`F${nameRow + 1}`).value = signerRole;
      worksheet.getCell(`F${nameRow + 1}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`F${nameRow + 1}`).font = { size: 9, name: fontName, color: { argb: darkColor } };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Laporan_${finalReportNumber.replace(/\//g, '-')}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();

    } else if (format === 'pdf') {
      // --- 5B. EXPORT PDF (TETAP SAMA - SUDAH BENAR) ---
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Laporan_${finalReportNumber.replace(/\//g, '-')}.pdf`);

      doc.pipe(res);

      doc.fillColor('#1F2937').fontSize(20).font('Helvetica-Bold').text('LAPORAN PENJUALAN', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('SelempangKu Official Store', { align: 'center' }).moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E40AF').text(`No: ${finalReportNumber}`, { align: 'center' }).fillColor('#1F2937').moveDown();

      doc.fontSize(10).font('Helvetica').text(`Periode Laporan : ${periodText}`, { align: 'left' });
      doc.text(`Dicetak Pada      : ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB`, { align: 'left' });
      doc.moveDown();

      const tableTop = 190;
      const startX = 50; 
      const rowHeight = 25; 
      
      const colWidths = {
        id: 35,       
        date: 65,     
        customer: 95, 
        product: 160, 
        qty: 35,      
        total: 105    
      };

      const colX = {
        id: startX,
        date: startX + colWidths.id,
        customer: startX + colWidths.id + colWidths.date,
        product: startX + colWidths.id + colWidths.date + colWidths.customer,
        qty: startX + colWidths.id + colWidths.date + colWidths.customer + colWidths.product,
        total: startX + colWidths.id + colWidths.date + colWidths.customer + colWidths.product + colWidths.qty
      };
      
      const drawCell = (text, x, y, width, align = 'left', isHeader = false) => {
        if (isHeader) {
            doc.fillColor('#E5E7EB').rect(x, y, width, rowHeight).fill().fillColor('#111827');
        }
        doc.rect(x, y, width, rowHeight).strokeColor('#374151').lineWidth(0.5).stroke();
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(isHeader ? 9 : 8)
           .text(text, x + 5, y + 8, { width: width - 8, align: align, height: rowHeight, ellipsis: true });
      };

      let currentY = tableTop;

      drawCell('ID', colX.id, currentY, colWidths.id, 'center', true);
      drawCell('Tanggal', colX.date, currentY, colWidths.date, 'left', true);
      drawCell('Pelanggan', colX.customer, currentY, colWidths.customer, 'left', true);
      drawCell('Produk', colX.product, currentY, colWidths.product, 'left', true);
      drawCell('Qty', colX.qty, currentY, colWidths.qty, 'center', true);
      drawCell('Total (Rp)', colX.total, currentY, colWidths.total, 'right', true);
      
      currentY += rowHeight;

      let totalRevenue = 0;

      orders.forEach((order) => {
        if (currentY > 700) {
            doc.addPage();
            currentY = 50; 
            drawCell('ID', colX.id, currentY, colWidths.id, 'center', true);
            drawCell('Tanggal', colX.date, currentY, colWidths.date, 'left', true);
            drawCell('Pelanggan', colX.customer, currentY, colWidths.customer, 'left', true);
            drawCell('Produk', colX.product, currentY, colWidths.product, 'left', true);
            drawCell('Qty', colX.qty, currentY, colWidths.qty, 'center', true);
            drawCell('Total (Rp)', colX.total, currentY, colWidths.total, 'right', true);
            currentY += rowHeight;
        }

        const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID');
        const formattedTotal = parseFloat(order.total_price).toLocaleString('id-ID');
        const userName = order.user_name || order.User?.name || 'Guest';
        const productName = order.product_name || order.Product?.name || 'Item';
        const quantity = order.quantity || 1;

        doc.fillColor('#374151'); 

        drawCell(`#${order.id}`, colX.id, currentY, colWidths.id, 'center');
        drawCell(formattedDate, colX.date, currentY, colWidths.date, 'left');
        drawCell(userName, colX.customer, currentY, colWidths.customer, 'left');
        drawCell(productName, colX.product, currentY, colWidths.product, 'left');
        drawCell(quantity.toString(), colX.qty, currentY, colWidths.qty, 'center');
        drawCell(formattedTotal, colX.total, currentY, colWidths.total, 'right');

        totalRevenue += parseFloat(order.total_price);
        currentY += rowHeight;
      });

      const totalLabelWidth = colWidths.id + colWidths.date + colWidths.customer + colWidths.product + colWidths.qty;
      doc.font('Helvetica-Bold');
      doc.rect(colX.id, currentY, totalLabelWidth, rowHeight).stroke(); 
      doc.text('TOTAL PENDAPATAN', colX.id, currentY + 8, { width: totalLabelWidth - 10, align: 'right' });
      doc.rect(colX.total, currentY, colWidths.total, rowHeight).stroke();
      doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, colX.total + 5, currentY + 8, { width: colWidths.total - 10, align: 'right' });
      
      currentY += (rowHeight + 20); 

      if (currentY > 600) {
        doc.addPage();
        currentY = 50;
      }

      const leftColX = 50;
      const rightColX = 350;
      const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6B7280');
      doc.text('Catatan:', leftColX, currentY);
      doc.text(`1. No Laporan: ${finalReportNumber}`, leftColX, currentY + 12);
      doc.text('2. Harap periksa kembali kesesuaian data fisik.', leftColX, currentY + 24);

      doc.fontSize(10).font('Helvetica').fillColor('#111827');
      doc.text(`Padang, ${dateString}`, rightColX, currentY);
      doc.moveDown(0.2);
      doc.text('Yang Mengesahkan,', rightColX, doc.y);
      
      doc.moveDown(4); 
      const signY = doc.y;

      doc.font('Helvetica-Bold').text(signerName, rightColX, signY);
      const nameWidth = doc.widthOfString(signerName);
      doc.strokeColor('#111827').lineWidth(1).moveTo(rightColX, signY + 12).lineTo(rightColX + nameWidth, signY + 12).stroke();
      doc.fontSize(9).font('Helvetica').text(signerRole, rightColX, signY + 16);

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9CA3AF').text(
          `Halaman ${i + 1} dari ${pageCount} | Dokumen: ${finalReportNumber}`,
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