import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiCheck, FiX, FiTruck, FiCreditCard, FiEye, FiFilter, FiChevronRight } from 'react-icons/fi';
import { orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import {
  ResponsiveContainer,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return <FiCreditCard className="text-yellow-500 w-4 h-4" />;
      case 'Menunggu Verifikasi':
        return <FiClock className="text-blue-500 w-4 h-4" />;
      case 'Proses Produksi':
        return <FiPackage className="text-purple-500 w-4 h-4" />;
      case 'Dalam Pengiriman':
        return <FiTruck className="text-blue-500 w-4 h-4" />;
      case 'Selesai':
        return <FiCheck className="text-green-500 w-4 h-4" />;
      case 'Ditolak':
        return <FiX className="text-red-500 w-4 h-4" />;
      default:
        return <FiPackage className="text-gray-500 w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const statusOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'Menunggu Pembayaran', label: 'Menunggu Pembayaran' },
    { value: 'Menunggu Verifikasi', label: 'Menunggu Verifikasi' },
    { value: 'Proses Produksi', label: 'Proses Produksi' },
    { value: 'Dalam Pengiriman', label: 'Dalam Pengiriman' },
    { value: 'Selesai', label: 'Selesai' },
    { value: 'Ditolak', label: 'Ditolak' }
  ];

  const StatusStep = ({ icon, label, active, current }) => (
    <div className={`flex flex-col items-center ${
      active ? 'text-green-600' : current ? 'text-primary-600' : 'text-gray-400'
    }`}>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 ${
        active ? 'bg-green-100' : current ? 'bg-primary-100' : 'bg-gray-100'
      }`}>
        {icon}
      </div>
      <span className="hidden sm:block text-xs">{label}</span>
    </div>
  );

  const FilterSheet = () => (
    <>
      {showFilterSheet && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFilterSheet(false)}
        />
      )}
      <div className={`md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ${
        showFilterSheet ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-4 border-b">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Filter Status</h3>
            <button 
              onClick={() => setShowFilterSheet(false)}
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => { setFilter(option.value); setShowFilterSheet(false); }}
              className={`w-full min-h-[52px] p-4 rounded-xl text-left flex items-center justify-between ${
                filter === option.value ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-base">{option.label}</span>
              {filter === option.value && <FiCheck className="w-5 h-5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 overflow-x-hidden">
      <ResponsiveContainer>
        <ResponsiveTypography.H2 className="text-gray-900 mb-4 sm:mb-6">
          Riwayat Pesanan
        </ResponsiveTypography.H2>

        {/* Mobile: Filter Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilterSheet(true)}
            className="w-full min-h-[48px] px-4 py-3 bg-white rounded-xl shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-500" />
              <span className="text-base font-medium">
                {filter === 'all' ? 'Semua Status' : filter}
              </span>
            </div>
            <FiChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Desktop: Filter Pills */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-12 sm:py-16 px-4">
            <FiPackage className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4" />
            <ResponsiveTypography.Body className="text-gray-500 mb-4">
              {filter === 'all' 
                ? 'Belum ada pesanan' 
                : `Tidak ada pesanan dengan status "${filter}"`
              }
            </ResponsiveTypography.Body>
            <Link 
              to="/catalog" 
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  <ResponsiveImage
                    src={getImageUrl(order.product_image)}
                    alt={order.product_name}
                    className="w-full md:w-32 h-32 object-cover rounded-lg"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900">{order.product_name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="hidden sm:inline">{order.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm sm:text-base mb-4">
                      <div>
                        <p className="text-gray-500">Jumlah</p>
                        <p className="font-medium">{order.quantity} pcs</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-primary-600">{formatCurrency(order.total_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tanggal</p>
                        <p className="font-medium">{formatDateTime(order.created_at)}</p>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-500 mb-4">
                        <span className="font-medium">Catatan:</span> {order.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {order.status === 'Menunggu Pembayaran' && (
                        <Link
                          to={`/payment/${order.id}`}
                          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors gap-2"
                        >
                          <FiCreditCard className="w-5 h-5" /> Bayar Sekarang
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <StatusStep 
                      icon={<FiCreditCard className="w-4 h-4" />} 
                      label="Pembayaran" 
                      active={order.status !== 'Menunggu Pembayaran'}
                      current={order.status === 'Menunggu Pembayaran'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2" />
                    <StatusStep 
                      icon={<FiClock className="w-4 h-4" />} 
                      label="Verifikasi" 
                      active={['Proses Produksi', 'Dalam Pengiriman', 'Selesai'].includes(order.status)}
                      current={order.status === 'Menunggu Verifikasi'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2" />
                    <StatusStep 
                      icon={<FiPackage className="w-4 h-4" />} 
                      label="Produksi" 
                      active={['Dalam Pengiriman', 'Selesai'].includes(order.status)}
                      current={order.status === 'Proses Produksi'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2" />
                    <StatusStep 
                      icon={<FiTruck className="w-4 h-4" />} 
                      label="Pengiriman" 
                      active={order.status === 'Selesai'}
                      current={order.status === 'Dalam Pengiriman'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-1 sm:mx-2" />
                    <StatusStep 
                      icon={<FiCheck className="w-4 h-4" />} 
                      label="Selesai" 
                      active={order.status === 'Selesai'}
                      current={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ResponsiveContainer>

      {/* Mobile Filter Sheet */}
      <FilterSheet />
    </div>
  );
};

export default OrderHistory;
