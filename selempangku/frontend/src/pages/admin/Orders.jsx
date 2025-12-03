import React, { useState, useEffect } from 'react';
import { FiEye, FiX } from 'react-icons/fi';
import { orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getImageUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('');

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

  const statusOptions = [
    'Menunggu Pembayaran',
    'Menunggu Verifikasi',
    'Proses Produksi',
    'Dalam Pengiriman',
    'Selesai',
    'Ditolak'
  ];

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
          onClick={() => setSelectedOrder(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <FiEye />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">Semua Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="Belum ada pesanan"
      />

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detail Pesanan #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={getImageUrl(selectedOrder.product_image)}
                  alt={selectedOrder.product_name}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                />
                <div>
                  <h3 className="font-semibold">{selectedOrder.product_name}</h3>
                  <p className="text-sm text-gray-500">Qty: {selectedOrder.quantity}</p>
                  <p className="text-lg font-bold text-primary-600 mt-2">
                    {formatCurrency(selectedOrder.total_price)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Informasi Customer</h3>
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
                  <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="font-semibold mb-2">Update Status</h3>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="input-field"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Tanggal Pesanan: {formatDateTime(selectedOrder.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
