import React, { useState, useEffect } from 'react';
import { FiCalendar, FiTrendingUp, FiDollarSign, FiShoppingCart, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReport();
  }, [period, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { period, ...dateRange };
      const response = await reportService.getSales(params);
      setSalesData(response.data.salesData);
      setSummary(response.data.summary);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            <h3 className="font-semibold text-lg">Filter Tanggal</h3>
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

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        {/* Period Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('daily')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Bulanan
          </button>
        </div>

        {/* Mobile: Date Filter Button */}
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
              : 'Filter Tanggal'}
          </span>
        </button>
        
        {/* Tablet/Desktop: Inline Date Picker */}
        <div className="hidden md:flex gap-2 items-center flex-wrap">
          <FiCalendar className="text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearDateRange}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
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

      {/* Charts - Stack on tablet */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">Grafik Penjualan</h2>
          {salesData.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
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
            <div className="h-64 flex items-center justify-center text-gray-500">
              Tidak ada data untuk periode ini
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base md:text-lg font-semibold mb-4">Jumlah Pesanan</h2>
          {salesData.length > 0 ? (
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
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
            <div className="h-64 flex items-center justify-center text-gray-500">
              Tidak ada data untuk periode ini
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Riwayat Transaksi</h2>
        </div>

        {/* Mobile: Card List */}
        <div className="md:hidden p-4 space-y-3">
          {paginatedTransactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Tidak ada transaksi</p>
          ) : (
            paginatedTransactions.map((tx) => <TransactionCard key={tx.id} tx={tx} />)
          )}
          <Pagination />
        </div>

        {/* Tablet: Compact Table (768px - 1023px) */}
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
                    Tidak ada transaksi
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

        {/* Desktop: Full Table (1024px+) */}
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
                      Tidak ada transaksi
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
    </div>
  );
};

export default Reports;