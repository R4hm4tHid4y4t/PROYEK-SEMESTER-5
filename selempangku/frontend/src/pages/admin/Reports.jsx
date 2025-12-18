import React, { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiTrendingUp, FiDollarSign, FiShoppingCart, FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { reportService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { ResponsiveGrid, ResponsiveTableWrapper } from '../../components/common/ResponsiveLayout';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE UNTUK EXPORT ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    format: 'excel',
    periodType: 'monthly', // 'daily', 'monthly', 'custom'
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    customStartDate: '',
    customEndDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [period, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { period, ...dateRange };
      const response = await reportService.getSales(params);
      
      setSummary(response.data.summary || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 });
      setTransactions(response.data.transactions || []);
      
    } catch (error) {
      console.error('Error fetching report:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC GRAFIK ---
  const processedSalesData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const isMonthlyView = period === 'monthly' && !dateRange.startDate;
    const grouped = {};
    
    transactions.forEach(tx => {
      if(!tx.created_at) return;
      const date = new Date(tx.created_at);
      let key;
      
      if (isMonthlyView) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        key = `${date.getFullYear()}-${month}`;
      } else {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        key = `${date.getFullYear()}-${month}-${day}`;
      }

      if (!grouped[key]) grouped[key] = { date: key, total: 0, count: 0 };
      grouped[key].total += parseFloat(tx.total_price || 0);
      grouped[key].count += 1;
    });

    const sortedKeys = Object.keys(grouped).sort();
    if (sortedKeys.length === 0) return [];

    const filledData = [];
    let startStr = dateRange.startDate || sortedKeys[0];
    let endStr = dateRange.endDate || sortedKeys[sortedKeys.length - 1];
    
    if (isMonthlyView && startStr.length > 7) startStr = startStr.substring(0, 7);
    if (isMonthlyView && endStr.length > 7) endStr = endStr.substring(0, 7);

    let current = new Date(startStr + (isMonthlyView ? '-01' : ''));
    const end = new Date(endStr + (isMonthlyView ? '-01' : ''));

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      let key;

      if (isMonthlyView) {
        key = `${year}-${month}`;
        current.setMonth(current.getMonth() + 1);
      } else {
        const day = String(current.getDate()).padStart(2, '0');
        key = `${year}-${month}-${day}`;
        current.setDate(current.getDate() + 1);
      }

      if (grouped[key]) {
        filledData.push(grouped[key]);
      } else {
        filledData.push({ date: key, total: 0, count: 0 });
      }
    }

    return filledData;
  }, [transactions, period, dateRange]);

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    if(period !== 'custom') setPeriod('custom');
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setPeriod('monthly');
  };

  // --- LOGIC EXPORT BARU ---
  const handleExport = async () => {
    try {
      setIsExporting(true);

      const params = {
          format: exportConfig.format,
          period: 'custom', 
          startDate: '',
          endDate: ''
      };

      if (exportConfig.periodType === 'daily') {
          const today = new Date().toISOString().split('T')[0];
          params.startDate = today;
          params.endDate = today;
      } else if (exportConfig.periodType === 'monthly') {
          const start = new Date(exportConfig.selectedYear, exportConfig.selectedMonth - 1, 1);
          const end = new Date(exportConfig.selectedYear, exportConfig.selectedMonth, 0);
          
          const offset = start.getTimezoneOffset() * 60000;
          params.startDate = new Date(start.getTime() - offset).toISOString().split('T')[0];
          params.endDate = new Date(end.getTime() - offset).toISOString().split('T')[0];
      } else {
          params.startDate = exportConfig.customStartDate;
          params.endDate = exportConfig.customEndDate;
      }

      const response = await reportService.export(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const ext = exportConfig.format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `Laporan_Penjualan_${params.startDate}_to_${params.endDate}.${ext}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengunduh laporan. ' + (error.message || ''));
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ExportModal = () => {
    if (!showExportModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Export Laporan</h3>
            <button onClick={() => setShowExportModal(false)}><FiX className="w-6 h-6" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Format File</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportConfig({ ...exportConfig, format: 'excel' })}
                  className={`p-3 rounded-lg border text-center transition-colors ${exportConfig.format === 'excel' ? 'bg-green-50 border-green-500 text-green-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => setExportConfig({ ...exportConfig, format: 'pdf' })}
                  className={`p-3 rounded-lg border text-center transition-colors ${exportConfig.format === 'pdf' ? 'bg-red-50 border-red-500 text-red-700 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  PDF (Resmi)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Periode Laporan</label>
              <select
                value={exportConfig.periodType}
                onChange={(e) => setExportConfig({ ...exportConfig, periodType: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="daily">Harian (Hari Ini)</option>
                <option value="monthly">Bulanan</option>
                <option value="custom">Custom Tanggal</option>
              </select>
            </div>

            {exportConfig.periodType === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Bulan</label>
                        <select 
                            value={exportConfig.selectedMonth}
                            onChange={(e) => setExportConfig({...exportConfig, selectedMonth: parseInt(e.target.value)})}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>
                                    {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Tahun</label>
                        <input 
                            type="number" 
                            value={exportConfig.selectedYear}
                            onChange={(e) => setExportConfig({...exportConfig, selectedYear: parseInt(e.target.value)})}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {exportConfig.periodType === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Dari</label>
                  <input
                    type="date"
                    value={exportConfig.customStartDate}
                    onChange={(e) => setExportConfig({ ...exportConfig, customStartDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sampai</label>
                  <input
                    type="date"
                    value={exportConfig.customEndDate}
                    onChange={(e) => setExportConfig({ ...exportConfig, customEndDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800">
                <strong>Info:</strong> Nomor Laporan resmi (Audit Trail) akan digenerate otomatis dan tercantum di dalam file hasil download.
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium mt-4 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
            >
              {isExporting ? 'Downloading...' : <><FiDownload className="w-4 h-4" /> Download Laporan</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DateSheet = () => (
      <>
        {showDateSheet && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDateSheet(false)}
          />
        )}
        <div className={`md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ${
          showDateSheet ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="p-4 border-b">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filter Dashboard</h3>
              <button onClick={() => setShowDateSheet(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  clearDateRange();
                  setShowDateSheet(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setShowDateSheet(false)}
                className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-xl"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      </>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-50"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <span className="px-4">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-100 disabled:opacity-50"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const TransactionCard = ({ tx }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500">Order #{tx.id}</p>
          <p className="font-semibold">{tx.product_name}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
          {tx.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{tx.user_name}</p>
          <p className="text-xs text-gray-400">{formatDateTime(tx.created_at)}</p>
        </div>
        <p className="font-bold text-primary-600">{formatCurrency(tx.total_price)}</p>
      </div>
    </div>
  );

  if (loading && transactions.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 lg:pb-0 p-4 md:p-6">
      {/* Header with Export Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard & Laporan</h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <FiDownload className="w-5 h-5" />
          <span className="font-medium">Export Laporan</span>
        </button>
      </div>

      {/* Filters Dashboard (View Only) */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex justify-between items-center">
             <div className="text-sm font-semibold text-gray-500">Filter Tampilan Dashboard</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setPeriod('daily'); setDateRange({startDate: '', endDate: ''}); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              period === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => { setPeriod('monthly'); setDateRange({startDate: '', endDate: ''}); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              period === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Bulanan
          </button>
        </div>

        <button
          onClick={() => setShowDateSheet(true)}
          className={`md:hidden w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 ${
            dateRange.startDate || dateRange.endDate
              ? 'bg-primary-50 border-2 border-primary-500 text-primary-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <FiCalendar className="w-5 h-5" />
          <span className="font-medium">
            {dateRange.startDate || dateRange.endDate
              ? `${dateRange.startDate || '...'} - ${dateRange.endDate || '...'}`
              : 'Custom Tanggal'}
          </span>
        </button>
        
        <div className="hidden md:flex gap-2 items-center flex-wrap">
          <FiCalendar className="text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearDateRange}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm"
            >
              <FiX className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid cols={3} gap={4}>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Pesanan</p>
              <p className="text-lg md:text-2xl font-bold text-blue-600">{summary.totalOrders}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Rata-rata Order</p>
              <p className="text-lg md:text-2xl font-bold text-purple-600">{formatCurrency(summary.averageOrderValue)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </ResponsiveGrid>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">Grafik Penjualan</h2>
          {processedSalesData.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="total" name="Revenue" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
              <FiTrendingUp className="w-12 h-12 mb-2 opacity-50" />
              <p>Tidak ada data penjualan pada periode ini</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">Jumlah Pesanan</h2>
          {processedSalesData.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" name="Pesanan" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
              <FiShoppingCart className="w-12 h-12 mb-2 opacity-50" />
              <p>Tidak ada pesanan pada periode ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Riwayat Transaksi</h2>
        </div>

        {/* Mobile View */}
        <div className="md:hidden p-4 space-y-3">
          {paginatedTransactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Tidak ada transaksi pada periode ini</p>
          ) : (
            paginatedTransactions.map((tx) => <TransactionCard key={tx.id} tx={tx} />)
          )}
          <Pagination />
        </div>

        {/* Tablet View (DIPERBAIKI) */}
        <div className="hidden md:block lg:hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                    Tidak ada transaksi pada periode ini
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium">#{tx.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-sm">{tx.product_name}</p>
                      <p className="text-xs text-gray-500">{tx.user_name}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(tx.created_at)}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold">{formatCurrency(tx.total_price)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination />
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <ResponsiveTableWrapper>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada transaksi pada periode ini
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">#{tx.id}</td>
                      <td className="px-6 py-4">{tx.product_name}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{tx.user_name}</p>
                          <p className="text-sm text-gray-500">{tx.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(tx.total_price)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDateTime(tx.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ResponsiveTableWrapper>
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination />
            </div>
          )}
        </div>
      </div>

      <DateSheet />
      <ExportModal />
    </div>
  );
};

export default Reports;