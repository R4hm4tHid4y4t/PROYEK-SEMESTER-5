import React, { useState, useEffect } from 'react';
import { FiEye, FiCheck, FiX, FiImage, FiFilter, FiCreditCard, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { paymentService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getPaymentProofUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
// ResponsiveLayout components available if needed

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
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
      setShowDetailSheet(false);
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
      setShowDetailSheet(false);
    } catch (error) {
      toast.error('Gagal menolak pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowDetailSheet(true);
  };

  const statusOptions = ['Menunggu Verifikasi', 'Verifikasi', 'Ditolak'];

  const columns = [
    {
      header: 'ID',
      render: (row) => <span className="font-medium text-base">#{row.id}</span>
    },
    {
      header: 'Order',
      render: (row) => (
        <div>
          <p className="font-medium text-base">#{row.order_id}</p>
          <p className="text-sm text-gray-500">{row.product_name}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-base">{row.user_name}</p>
          <p className="text-sm text-gray-500">{row.user_email}</p>
        </div>
      )
    },
    {
      header: 'Bank',
      render: (row) => (
        <div>
          <p className="font-medium text-base">{row.bank_name}</p>
          <p className="text-sm text-gray-500">{row.account_number}</p>
        </div>
      )
    },
    {
      header: 'Jumlah',
      render: (row) => <span className="text-base font-medium">{formatCurrency(row.amount)}</span>
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Tanggal',
      render: (row) => <span className="text-base">{formatDateTime(row.created_at)}</span>
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleViewPayment(row)}
            className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center"
            title="Lihat Detail"
          >
            <FiEye className="w-5 h-5" />
          </button>
          {row.status === 'Menunggu Verifikasi' && (
            <>
              <button
                onClick={() => handleVerify(row.id)}
                className="min-w-[44px] min-h-[44px] p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center"
                title="Verifikasi"
              >
                <FiCheck className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedPayment(row);
                  setShowRejectModal(true);
                }}
                className="min-w-[44px] min-h-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                title="Tolak"
              >
                <FiX className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const PaymentCard = ({ payment }) => (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
      onClick={() => handleViewPayment(payment)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">Payment #{payment.id}</p>
          <p className="font-semibold text-base">Order #{payment.order_id}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{payment.user_name}</p>
          <p className="font-bold text-lg text-primary-600">{formatCurrency(payment.amount)}</p>
        </div>
        <FiChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-xs text-gray-400 mt-2">{formatDateTime(payment.created_at)}</p>
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
        
        <div className="p-4 space-y-2">
          <button
            onClick={() => { setFilter(''); setShowFilterSheet(false); }}
            className={`w-full min-h-[52px] p-4 rounded-xl text-left flex items-center justify-between ${
              !filter ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
            }`}
          >
            <span className="font-medium">Semua Status</span>
            {!filter && <FiCheck className="w-5 h-5 text-primary-600" />}
          </button>
          
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setShowFilterSheet(false); }}
              className={`w-full min-h-[52px] p-4 rounded-xl text-left flex items-center justify-between ${
                filter === status ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
              }`}
            >
              <span className="font-medium">{status}</span>
              {filter === status && <FiCheck className="w-5 h-5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const DetailSheet = () => {
    if (!selectedPayment) return null;

    return (
      <>
        {showDetailSheet && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDetailSheet(false)}
          />
        )}
        <div className={`lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 max-h-[90vh] overflow-hidden ${
          showDetailSheet ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detail Pembayaran #{selectedPayment.id}</h3>
              <button 
                onClick={() => setShowDetailSheet(false)}
                className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {/* Payment Proof */}
            <div>
              <h4 className="font-medium mb-2">Bukti Pembayaran</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {selectedPayment.payment_proof ? (
                  <img
                    src={getPaymentProofUrl(selectedPayment.payment_proof)}
                    alt="Bukti Pembayaran"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                    onError={(e) => {
                      e.target.parentNode.innerHTML = '<p class="text-gray-500 text-center py-8">Gambar tidak dapat dimuat</p>';
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiImage className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-base">Tidak ada bukti pembayaran</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Order ID</span>
                <span className="font-medium">#{selectedPayment.order_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Jumlah</span>
                <span className="font-bold text-primary-600">{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{selectedPayment.user_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Bank Tujuan</span>
                <span className="font-medium">{selectedPayment.bank_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-medium">{formatDateTime(selectedPayment.created_at)}</span>
              </div>
            </div>

            {selectedPayment.verification_notes && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Catatan Verifikasi</p>
                <p className="text-base">{selectedPayment.verification_notes}</p>
              </div>
            )}

            {/* Actions */}
            {selectedPayment.status === 'Menunggu Verifikasi' && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={processing}
                  className="flex-1 min-h-[48px] py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" /> Verifikasi
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="flex-1 min-h-[48px] py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiX className="w-5 h-5" /> Tolak
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const DesktopModal = () => {
    if (!selectedPayment || !showDetailSheet) return null;

    return (
      <div className="hidden lg:flex fixed inset-0 bg-black/50 items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detail Pembayaran #{selectedPayment.id}</h2>
            <button 
              onClick={() => setShowDetailSheet(false)} 
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
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
            <div className="grid grid-cols-2 gap-4 text-base">
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
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
                <p className="bg-yellow-50 p-3 rounded-lg text-base">{selectedPayment.verification_notes}</p>
              </div>
            )}

            {/* Actions */}
            {selectedPayment.status === 'Menunggu Verifikasi' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={processing}
                  className="flex-1 min-h-[48px] py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" /> Verifikasi
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="flex-1 min-h-[48px] py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiX className="w-5 h-5" /> Tolak
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RejectModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Tolak Pembayaran</h2>
          <button 
            onClick={() => { setShowRejectModal(false); setRejectNotes(''); }}
            className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Alasan Penolakan
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={4}
              className="w-full min-h-[120px] px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowRejectModal(false); setRejectNotes(''); }}
              className="flex-1 min-h-[48px] px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 min-h-[48px] px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Memproses...' : 'Tolak Pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} pembayaran total</p>
        </div>
        
        {/* Desktop Filter */}
        <div className="hidden md:flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-h-[44px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Semua Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button 
            onClick={fetchPayments}
            className="min-h-[44px] min-w-[44px] p-2 bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile: Filter & Refresh */}
      <div className="md:hidden flex gap-2">
        <button
          onClick={() => setShowFilterSheet(true)}
          className="flex-1 min-h-[48px] px-4 py-3 bg-white border border-gray-300 rounded-xl flex items-center justify-center gap-2"
        >
          <FiFilter className="w-5 h-5" />
          <span className="font-medium">{filter || 'Semua Status'}</span>
        </button>
        <button 
          onClick={fetchPayments}
          className="min-h-[48px] min-w-[48px] p-3 bg-gray-100 rounded-xl flex items-center justify-center"
        >
          <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FiCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada pembayaran</p>
          </div>
        ) : (
          payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          emptyMessage="Belum ada pembayaran"
        />
      </div>

      {/* Bottom Sheets */}
      <FilterSheet />
      <DetailSheet />
      <DesktopModal />

      {/* Reject Modal */}
      {showRejectModal && <RejectModal />}
    </div>
  );
};

export default Payments;
