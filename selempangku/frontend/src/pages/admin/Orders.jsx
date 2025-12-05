import React, { useState, useEffect } from 'react';
import { FiEye, FiX, FiCheck, FiClock, FiAlertCircle, FiPackage, FiTruck, FiSearch, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getImageUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter) params.status = filter;
      const response = await orderService.getAll(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      toast.success('Status pesanan diperbarui');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailSheet(true);
  };

  const statusOptions = [
    'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Proses Produksi',
    'Dalam Pengiriman', 'Selesai', 'Ditolak'
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return <FiClock className="w-4 h-4" />;
      case 'Menunggu Verifikasi': return <FiAlertCircle className="w-4 h-4" />;
      case 'Proses Produksi': return <FiPackage className="w-4 h-4" />;
      case 'Dalam Pengiriman': return <FiTruck className="w-4 h-4" />;
      case 'Selesai': return <FiCheck className="w-4 h-4" />;
      case 'Ditolak': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  // --- FILTERING LOGIC ---
  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        order.id.toString().includes(query) ||
        order.user_name?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    if (dateFrom || dateTo) {
      const orderDate = new Date(order.created_at);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }
    }
    return true;
  });

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  // --- COLUMNS DEFINITION (SIMPLIFIED) ---
  const columns = [
    {
      header: 'ID',
      render: (row) => <span className="font-medium text-gray-900">#{row.id}</span>
    },
    {
      header: 'Customer',
      render: (row) => (
        <div className="font-medium text-gray-900">{row.user_name}</div>
      )
    },
    {
      header: 'Total',
      render: (row) => (
        <span className="font-medium text-primary-600">{formatCurrency(row.total_price)}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {getStatusIcon(row.status)}
          {row.status}
        </span>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleViewOrder(row)}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Lihat Detail"
        >
          <FiEye className="w-5 h-5" />
        </button>
      )
    }
  ];

  // --- MOBILE CARD ---
  const OrderCard = ({ order }) => (
    <div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 active:bg-gray-50 transition-colors"
      onClick={() => handleViewOrder(order)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="font-bold text-gray-900">#{order.id}</span>
          <p className="text-sm text-gray-500 mt-0.5">{order.user_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {order.status}
        </span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-50">
        <span className="text-sm text-gray-500">{formatDateTime(order.created_at)}</span>
        <span className="font-bold text-primary-600">{formatCurrency(order.total_price)}</span>
      </div>
    </div>
  );

  // --- DETAIL MODAL CONTENT ---
  const DetailContent = ({ order }) => {
    if (!order) return null;
    return (
      <div className="space-y-6">
        {/* Status Update Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(order.id, e.target.value)}
            className="w-full input-field bg-white"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Product Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Produk</h4>
          <div className="flex gap-4 items-start">
            <img
              src={getImageUrl(order.product_image)}
              alt={order.product_name}
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              onError={(e) => { e.target.src = '/placeholder-product.png'; }}
            />
            <div>
              <h3 className="font-medium text-gray-900">{order.product_name}</h3>
              <p className="text-sm text-gray-500 mt-1">Qty: {order.quantity}</p>
              <p className="text-lg font-bold text-primary-600 mt-2">{formatCurrency(order.total_price)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Customer</h4>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="font-medium text-gray-900">{order.user_name}</p>
              <p className="text-sm text-gray-500">{order.user_email}</p>
              <p className="text-sm text-gray-500">{order.user_phone || '-'}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Pengiriman</h4>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{order.user_address || '-'}</p>
            </div>
          </div>
        </div>

        {order.notes && (
          <div>
             <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Catatan</h4>
             <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm">
               {order.notes}
             </div>
          </div>
        )}

        <div className="text-xs text-gray-400 text-center pt-4 border-t">
          Dibuat pada: {formatDateTime(order.created_at)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-sm text-gray-500">{filteredOrders.length} total pesanan</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari ID atau Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-field w-full sm:w-64"
              />
            </div>
            
            {/* Filter Buttons Group */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowDatePicker(true)}
                className={`p-2.5 rounded-lg border ${dateFrom ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-gray-200 text-gray-600 bg-white'}`}
              >
                <FiCalendar className="w-5 h-5" />
              </button>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field min-w-[140px]"
              >
                <option value="">Semua Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button onClick={fetchOrders} className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={filteredOrders}
                loading={loading}
                emptyMessage="Tidak ada pesanan yang sesuai filter"
              />
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {filteredOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tidak ada pesanan</p>
              ) : (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Date Picker Sheet */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 animate-slide-up md:animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">Filter Tanggal</h3>
                <button onClick={() => setShowDatePicker(false)} className="p-1"><FiX className="w-6 h-6" /></button>
              </div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field w-full" placeholder="Dari" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field w-full" placeholder="Sampai" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => { clearDateFilter(); setShowDatePicker(false); }} className="flex-1 btn-secondary">Reset</button>
                <button onClick={() => setShowDatePicker(false)} className="flex-1 btn-primary">Terapkan</button>
              </div>
           </div>
        </div>
      )}

      {/* Detail Modal/Sheet */}
      {(showDetailSheet && selectedOrder) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowDetailSheet(false)}>
          <div 
            className="bg-white w-full md:max-w-2xl h-[85vh] md:h-auto md:max-h-[90vh] md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slide-up md:animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
              <h2 className="text-lg font-bold">Detail Pesanan #{selectedOrder.id}</h2>
              <button onClick={() => setShowDetailSheet(false)} className="p-2 hover:bg-gray-100 rounded-full"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <DetailContent order={selectedOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;