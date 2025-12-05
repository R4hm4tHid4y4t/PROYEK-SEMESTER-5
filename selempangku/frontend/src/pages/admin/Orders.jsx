import React, { useState, useEffect } from 'react';
import { FiEye, FiX, FiFilter, FiChevronRight, FiPackage, FiTruck, FiCheck, FiClock, FiAlertCircle, FiSearch, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getImageUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
import { ResponsiveTableWrapper } from '../../components/common/ResponsiveLayout';

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
    'Menunggu Pembayaran',
    'Menunggu Verifikasi',
    'Proses Produksi',
    'Dalam Pengiriman',
    'Selesai',
    'Ditolak'
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return <FiClock className="w-4 h-4" />;
      case 'Menunggu Verifikasi':
        return <FiAlertCircle className="w-4 h-4" />;
      case 'Proses Produksi':
        return <FiPackage className="w-4 h-4" />;
      case 'Dalam Pengiriman':
        return <FiTruck className="w-4 h-4" />;
      case 'Selesai':
        return <FiCheck className="w-4 h-4" />;
      case 'Ditolak':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const getTimelineSteps = (currentStatus) => {
    const steps = [
      { status: 'Menunggu Pembayaran', label: 'Pembayaran', icon: FiClock },
      { status: 'Menunggu Verifikasi', label: 'Verifikasi', icon: FiAlertCircle },
      { status: 'Proses Produksi', label: 'Produksi', icon: FiPackage },
      { status: 'Dalam Pengiriman', label: 'Pengiriman', icon: FiTruck },
      { status: 'Selesai', label: 'Selesai', icon: FiCheck }
    ];
    
    const currentIndex = steps.findIndex(s => s.status === currentStatus);
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      pending: index > currentIndex
    }));
  };

  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        order.id.toString().includes(query) ||
        order.product_name?.toLowerCase().includes(query) ||
        order.user_name?.toLowerCase().includes(query) ||
        order.user_email?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Date range filter
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

  const columns = [
    {
      header: 'Order ID',
      render: (row) => <span className="font-medium">#{row.id}</span>
    },
    {
      header: 'Produk',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={getImageUrl(row.product_image)}
            alt={row.product_name}
            className="w-10 h-10 object-cover rounded"
            onError={(e) => { e.target.src = '/placeholder-product.png'; }}
          />
          <span>{row.product_name}</span>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium">{row.user_name}</p>
          <p className="text-sm text-gray-500">{row.user_email}</p>
        </div>
      )
    },
    {
      header: 'Qty',
      accessor: 'quantity'
    },
    {
      header: 'Total',
      render: (row) => formatCurrency(row.total_price)
    },
    {
      header: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`badge cursor-pointer ${getStatusColor(row.status)} border-0`}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      )
    },
    {
      header: 'Tanggal',
      render: (row) => formatDateTime(row.created_at)
    },
    {
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleViewOrder(row)}
          className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center"
        >
          <FiEye className="w-5 h-5" />
        </button>
      )
    }
  ];

  // Responsive Status Badge Component
  const StatusBadge = ({ status, size = 'default' }) => {
    const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-medium';
    const sizeClasses = size === 'small' 
      ? 'px-2 py-0.5 text-xs' 
      : 'px-3 py-1 text-sm';
    
    return (
      <span className={`${baseClasses} ${sizeClasses} ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <span className="hidden sm:inline">{status}</span>
      </span>
    );
  };

  // Mobile Order Card Component
  const OrderCard = ({ order }) => (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 active:bg-gray-50 transition-colors"
      onClick={() => handleViewOrder(order)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={getImageUrl(order.product_image)}
            alt={order.product_name}
            className="w-14 h-14 object-cover rounded-lg"
            onError={(e) => { e.target.src = '/placeholder-product.png'; }}
          />
          <div>
            <p className="font-semibold text-gray-900">#{order.id}</p>
            <p className="text-sm text-gray-600 line-clamp-1">{order.product_name}</p>
            <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
          </div>
        </div>
        <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">{order.user_name}</p>
          <p className="font-semibold text-primary-600">{formatCurrency(order.total_price)}</p>
        </div>
        <StatusBadge status={order.status} size="small" />
      </div>
      
      <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
    </div>
  );

  // Tablet Split View - Order Preview
  const OrderPreview = ({ order }) => {
    if (!order) {
      return (
        <div className="hidden md:flex lg:hidden flex-col items-center justify-center h-full bg-gray-50 rounded-xl">
          <FiPackage className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Pilih pesanan untuk melihat detail</p>
        </div>
      );
    }

    return (
      <div className="hidden md:block lg:hidden bg-white rounded-xl border border-gray-200 h-full overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Order #{order.id}</h3>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Product */}
          <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={getImageUrl(order.product_image)}
              alt={order.product_name}
              className="w-20 h-20 object-cover rounded-lg"
              onError={(e) => { e.target.src = '/placeholder-product.png'; }}
            />
            <div>
              <h4 className="font-medium">{order.product_name}</h4>
              <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
              <p className="font-bold text-primary-600 mt-1">{formatCurrency(order.total_price)}</p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="font-medium mb-3">Status Timeline</h4>
            <div className="space-y-2">
              {getTimelineSteps(order.status).map((step, index) => (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-100 text-green-600' :
                    step.current ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm ${step.current ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <h4 className="font-medium mb-2">Customer</h4>
            <p className="text-sm">{order.user_name}</p>
            <p className="text-sm text-gray-500">{order.user_email}</p>
          </div>

          {/* Update Status */}
          <div>
            <h4 className="font-medium mb-2">Update Status</h4>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
              className="input-field w-full min-h-[44px]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Filter Bottom Sheet
  const FilterSheet = () => (
    <>
      {showFilters && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFilters(false)}
        />
      )}
      <div className={`md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ${
        showFilters ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-4 border-b">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Filter Pesanan</h3>
            <button 
              onClick={() => setShowFilters(false)}
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => { setFilter(''); setShowFilters(false); }}
            className={`w-full p-4 rounded-xl text-left flex items-center justify-between min-h-[56px] ${
              !filter ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
            }`}
          >
            <span className="font-medium">Semua Status</span>
            {!filter && <FiCheck className="w-5 h-5 text-primary-600" />}
          </button>
          
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setShowFilters(false); }}
              className={`w-full p-4 rounded-xl text-left flex items-center justify-between min-h-[56px] ${
                filter === status ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <span className="font-medium">{status}</span>
              </div>
              {filter === status && <FiCheck className="w-5 h-5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // Mobile Detail Bottom Sheet
  const DetailSheet = () => {
    if (!selectedOrder) return null;
    
    const timeline = getTimelineSteps(selectedOrder.status);
    
    return (
      <>
        {showDetailSheet && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDetailSheet(false)}
          />
        )}
        <div className={`md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 max-h-[90vh] overflow-hidden ${
          showDetailSheet ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detail Pesanan #{selectedOrder.id}</h3>
              <button 
                onClick={() => setShowDetailSheet(false)}
                className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {/* Product Info */}
            <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={getImageUrl(selectedOrder.product_image)}
                alt={selectedOrder.product_name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.target.src = '/placeholder-product.png'; }}
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 line-clamp-2">{selectedOrder.product_name}</h4>
                <p className="text-sm text-gray-500">Qty: {selectedOrder.quantity}</p>
                <p className="font-bold text-lg text-primary-600 mt-1">{formatCurrency(selectedOrder.total_price)}</p>
              </div>
            </div>

            {/* Mobile Timeline - Horizontal Scroll */}
            <div>
              <h4 className="font-medium mb-3">Status Pesanan</h4>
              <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
                {timeline.map((step, index) => (
                  <div 
                    key={step.status}
                    className={`flex flex-col items-center min-w-[70px] p-2 rounded-xl ${
                      step.completed ? 'bg-green-50' :
                      step.current ? 'bg-primary-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      step.completed ? 'bg-green-100 text-green-600' :
                      step.current ? 'bg-primary-100 text-primary-600' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs text-center ${
                      step.current ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium mb-3">Informasi Customer</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-medium">{selectedOrder.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-right break-all">{selectedOrder.user_email}</span>
                </div>
                {selectedOrder.user_phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telepon</span>
                    <span className="font-medium">{selectedOrder.user_phone}</span>
                  </div>
                )}
                {selectedOrder.user_address && (
                  <div>
                    <span className="text-gray-500 block mb-1">Alamat</span>
                    <span className="font-medium">{selectedOrder.user_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <h4 className="font-medium mb-2">Catatan</h4>
                <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Update Status */}
            <div>
              <h4 className="font-medium mb-2">Update Status</h4>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className="input-field w-full min-h-[48px] text-base"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-400 text-center pb-4">
              Tanggal Pesanan: {formatDateTime(selectedOrder.created_at)}
            </p>
          </div>
        </div>
      </>
    );
  };

  // Desktop Filter Sidebar
  const FilterSidebar = () => (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
        <h3 className="font-semibold text-lg mb-4">Filter Status</h3>
        <div className="space-y-2">
          <button
            onClick={() => setFilter('')}
            className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
              !filter ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
            }`}
          >
            <span>Semua Status</span>
            <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">{orders.length}</span>
          </button>
          
          {statusOptions.map((status) => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                  filter === status ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="text-sm">{status}</span>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Desktop Modal
  const DesktopModal = () => {
    if (!selectedOrder || !showDetailSheet) return null;

    const timeline = getTimelineSteps(selectedOrder.status);

    return (
      <div className="hidden lg:flex fixed inset-0 bg-black/50 items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detail Pesanan #{selectedOrder.id}</h2>
            <button 
              onClick={() => setShowDetailSheet(false)} 
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Product Info */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={getImageUrl(selectedOrder.product_image)}
                    alt={selectedOrder.product_name}
                    className="w-28 h-28 object-cover rounded-xl"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOrder.product_name}</h3>
                    <p className="text-gray-500">Qty: {selectedOrder.quantity}</p>
                    <p className="text-2xl font-bold text-primary-600 mt-2">
                      {formatCurrency(selectedOrder.total_price)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Informasi Customer</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Nama</p>
                      <p className="font-medium">{selectedOrder.user_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedOrder.user_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Telepon</p>
                      <p className="font-medium">{selectedOrder.user_phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Alamat</p>
                      <p className="font-medium">{selectedOrder.user_address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Catatan</h3>
                    <p className="text-gray-600 bg-yellow-50 p-4 rounded-xl">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold mb-4">Status Timeline</h3>
                  <div className="space-y-4">
                    {timeline.map((step, index) => (
                      <div key={step.status} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100 text-green-600' :
                          step.current ? 'bg-primary-100 text-primary-600' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className={`block ${step.current ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                          {step.current && (
                            <span className="text-xs text-primary-600">Status saat ini</span>
                          )}
                        </div>
                        {step.completed && (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="font-semibold mb-2">Update Status</h3>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="input-field w-full"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t">
                  Tanggal Pesanan: {formatDateTime(selectedOrder.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Date Picker Sheet
  const DatePickerSheet = () => (
    <>
      {showDatePicker && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowDatePicker(false)}
        />
      )}
      <div className={`md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ${
        showDatePicker ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-4 border-b">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Filter Tanggal</h3>
            <button 
              onClick={() => setShowDatePicker(false)}
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field w-full min-h-[48px] text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field w-full min-h-[48px] text-base"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                clearDateFilter();
                setShowDatePicker(false);
              }}
              className="flex-1 min-h-[48px] px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
            >
              Reset
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 min-h-[48px] px-4 py-3 bg-primary-600 text-white font-medium rounded-xl"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{orders.length} pesanan total</p>
        </div>
        
        {/* Desktop Filter Dropdown & Date Picker */}
        <div className="hidden md:flex lg:hidden items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-48 min-h-[44px]"
          >
            <option value="">Semua Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Mobile Refresh Button */}
        <button 
          onClick={fetchOrders}
          className="hidden md:flex min-h-[44px] min-w-[44px] p-2 bg-gray-100 rounded-xl items-center justify-center lg:hidden"
        >
          <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mobile: Horizontal Scroll Status Chips */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setFilter('')}
            className={`flex-shrink-0 min-h-[40px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !filter 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          {statusOptions.map((status) => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-shrink-0 min-h-[40px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  filter === status 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusIcon(status)}
                <span>{status.split(' ')[0]}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === status ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar & Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari order ID, produk, atau customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-12 min-h-[48px] md:min-h-[44px]"
          />
        </div>
        
        {/* Mobile: Date Filter Button */}
        <div className="flex gap-2 md:hidden">
          <button 
            onClick={() => setShowDatePicker(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl min-h-[48px] ${
              dateFrom || dateTo 
                ? 'bg-primary-50 border-2 border-primary-500 text-primary-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <FiCalendar className="w-5 h-5" />
            <span className="text-sm font-medium">
              {dateFrom || dateTo ? 'Filter Aktif' : 'Tanggal'}
            </span>
          </button>
          <button 
            onClick={fetchOrders}
            className="min-h-[48px] min-w-[48px] p-3 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Desktop: Inline Date Picker */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[42px] border-0 focus:ring-0 text-sm bg-transparent"
              placeholder="Dari"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-[42px] border-0 focus:ring-0 text-sm bg-transparent"
              placeholder="Sampai"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={clearDateFilter}
              className="min-h-[44px] min-w-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <FilterSidebar />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada pesanan</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card List */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              {/* Tablet: Split View */}
              <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                        selectedOrder?.id === order.id 
                          ? 'border-primary-500 ring-2 ring-primary-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(order.product_image)}
                          alt={order.product_name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">#{order.id}</p>
                          <p className="text-sm text-gray-600 truncate">{order.product_name}</p>
                        </div>
                        <StatusBadge status={order.status} size="small" />
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-gray-500">{order.user_name}</span>
                        <span className="font-medium">{formatCurrency(order.total_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <OrderPreview order={selectedOrder} />
              </div>

              {/* Desktop: Full Data Table */}
              <div className="hidden lg:block">
                <DataTable
                  columns={columns}
                  data={filteredOrders}
                  loading={loading}
                  emptyMessage="Belum ada pesanan"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Order Count */}
      <div className="text-sm text-gray-500 text-center md:text-left">
        Menampilkan {filteredOrders.length} dari {orders.length} pesanan
      </div>

      {/* Mobile Bottom Sheets */}
      <FilterSheet />
      <DetailSheet />
      <DatePickerSheet />

      {/* Desktop Modal */}
      <DesktopModal />
    </div>
  );
};

export default Orders;
