import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiCheck, FiX, FiTruck, FiCreditCard, FiEye } from 'react-icons/fi';
import { orderService, paymentService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
        return <FiCreditCard className="text-yellow-500" />;
      case 'Menunggu Verifikasi':
        return <FiClock className="text-blue-500" />;
      case 'Proses Produksi':
        return <FiPackage className="text-purple-500" />;
      case 'Dalam Pengiriman':
        return <FiTruck className="text-blue-500" />;
      case 'Selesai':
        return <FiCheck className="text-green-500" />;
      case 'Ditolak':
        return <FiX className="text-red-500" />;
      default:
        return <FiPackage className="text-gray-500" />;
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

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Riwayat Pesanan</h1>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          <div className="card text-center py-12">
            <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {filter === 'all' 
                ? 'Belum ada pesanan' 
                : `Tidak ada pesanan dengan status "${filter}"`
              }
            </p>
            <Link to="/catalog" className="btn-primary inline-block">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  <img
                    src={getImageUrl(order.product_image)}
                    alt={order.product_name}
                    className="w-full md:w-32 h-32 object-cover rounded-lg"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                        <h3 className="font-semibold text-gray-900">{order.product_name}</h3>
                      </div>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'Menunggu Pembayaran' && (
                        <Link
                          to={`/payment/${order.id}`}
                          className="btn-primary text-sm py-2"
                        >
                          <FiCreditCard className="inline mr-1" /> Bayar Sekarang
                        </Link>
                      )}
                      <Link
                        to={`/order/${order.id}/detail`}
                        className="btn-secondary text-sm py-2"
                      >
                        <FiEye className="inline mr-1" /> Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <StatusStep 
                      icon={<FiCreditCard />} 
                      label="Pembayaran" 
                      active={order.status !== 'Menunggu Pembayaran'}
                      current={order.status === 'Menunggu Pembayaran'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-2" />
                    <StatusStep 
                      icon={<FiClock />} 
                      label="Verifikasi" 
                      active={['Proses Produksi', 'Dalam Pengiriman', 'Selesai'].includes(order.status)}
                      current={order.status === 'Menunggu Verifikasi'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-2" />
                    <StatusStep 
                      icon={<FiPackage />} 
                      label="Produksi" 
                      active={['Dalam Pengiriman', 'Selesai'].includes(order.status)}
                      current={order.status === 'Proses Produksi'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-2" />
                    <StatusStep 
                      icon={<FiTruck />} 
                      label="Pengiriman" 
                      active={order.status === 'Selesai'}
                      current={order.status === 'Dalam Pengiriman'}
                    />
                    <div className="flex-1 h-px bg-gray-200 mx-2" />
                    <StatusStep 
                      icon={<FiCheck />} 
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
      </div>
    </div>
  );
};

const StatusStep = ({ icon, label, active, current }) => (
  <div className={`flex flex-col items-center ${
    active ? 'text-green-600' : current ? 'text-primary-600' : 'text-gray-400'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
      active ? 'bg-green-100' : current ? 'bg-primary-100' : 'bg-gray-100'
    }`}>
      {icon}
    </div>
    <span className="hidden md:block">{label}</span>
  </div>
);

export default OrderHistory;
