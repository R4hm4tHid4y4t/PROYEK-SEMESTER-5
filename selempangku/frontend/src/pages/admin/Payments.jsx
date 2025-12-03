import React, { useState, useEffect } from 'react';
import { FiEye, FiCheck, FiX, FiImage } from 'react-icons/fi';
import { paymentService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getPaymentProofUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter) params.status = filter;
      const response = await paymentService.getAll(params);
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal memuat pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    if (!window.confirm('Verifikasi pembayaran ini?')) return;
    
    setProcessing(true);
    try {
      await paymentService.verify(id);
      toast.success('Pembayaran berhasil diverifikasi');
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Gagal memverifikasi pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      toast.error('Masukkan alasan penolakan');
      return;
    }

    setProcessing(true);
    try {
      await paymentService.reject(selectedPayment.id, rejectNotes);
      toast.success('Pembayaran ditolak');
      setShowRejectModal(false);
      setRejectNotes('');
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Gagal menolak pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      render: (row) => <span className="font-medium">#{row.id}</span>
    },
    {
      header: 'Order',
      render: (row) => (
        <div>
          <p className="font-medium">#{row.order_id}</p>
          <p className="text-sm text-gray-500">{row.product_name}</p>
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
      header: 'Bank',
      render: (row) => (
        <div>
          <p className="font-medium">{row.bank_name}</p>
          <p className="text-sm text-gray-500">{row.account_number}</p>
        </div>
      )
    },
    {
      header: 'Jumlah',
      render: (row) => formatCurrency(row.amount)
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`badge ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Tanggal',
      render: (row) => formatDateTime(row.created_at)
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedPayment(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Lihat Detail"
          >
            <FiEye />
          </button>
          {row.status === 'Menunggu Verifikasi' && (
            <>
              <button
                onClick={() => handleVerify(row.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Verifikasi"
              >
                <FiCheck />
              </button>
              <button
                onClick={() => {
                  setSelectedPayment(row);
                  setShowRejectModal(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Tolak"
              >
                <FiX />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const statusOptions = ['Menunggu Verifikasi', 'Verifikasi', 'Ditolak'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pembayaran</h1>
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
        data={payments}
        loading={loading}
        emptyMessage="Belum ada pembayaran"
      />

      {/* Detail Modal */}
      {selectedPayment && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detail Pembayaran #{selectedPayment.id}</h2>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Proof */}
              <div>
                <h3 className="font-semibold mb-2">Bukti Pembayaran</h3>
                <div className="border rounded-lg p-4">
                  {selectedPayment.payment_proof ? (
                    <img
                      src={getPaymentProofUrl(selectedPayment.payment_proof)}
                      alt="Bukti Pembayaran"
                      className="max-w-full max-h-96 mx-auto rounded-lg"
                      onError={(e) => {
                        e.target.parentNode.innerHTML = '<p class="text-gray-500 text-center py-8">Gambar tidak dapat dimuat</p>';
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiImage className="w-12 h-12 mx-auto mb-2" />
                      <p>Tidak ada bukti pembayaran</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-medium">#{selectedPayment.order_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Jumlah</p>
                  <p className="font-medium text-lg text-primary-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{selectedPayment.user_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bank Tujuan</p>
                  <p className="font-medium">{selectedPayment.bank_name} - {selectedPayment.account_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`badge ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDateTime(selectedPayment.created_at)}</p>
                </div>
              </div>

              {selectedPayment.verification_notes && (
                <div>
                  <p className="text-gray-500 text-sm">Catatan Verifikasi</p>
                  <p className="bg-yellow-50 p-3 rounded-lg text-sm">{selectedPayment.verification_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedPayment.status === 'Menunggu Verifikasi' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(selectedPayment.id)}
                    disabled={processing}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Verifikasi
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    <FiX /> Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Tolak Pembayaran</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectNotes('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="btn-danger flex-1"
                >
                  {processing ? 'Memproses...' : 'Tolak Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
