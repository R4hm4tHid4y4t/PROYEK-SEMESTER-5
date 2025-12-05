import React, { useState, useEffect } from 'react';
import { FiEye, FiCheck, FiX, FiRefreshCw, FiImage, FiCreditCard } from 'react-icons/fi';
import { paymentService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getPaymentProofUrl } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const Payments = () => {
  // State hanya untuk data dan aksi detail
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Mengambil semua data pembayaran tanpa filter
      const response = await paymentService.getAll({});
      setPayments(response.data.payments);
    } catch (error) {
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
      setShowDetail(false);
    } catch (error) {
      toast.error('Gagal verifikasi pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return toast.error('Mohon isi alasan penolakan');
    setProcessing(true);
    try {
      await paymentService.reject(selectedPayment.id, rejectNotes);
      toast.success('Pembayaran ditolak');
      fetchPayments();
      setShowDetail(false);
      setRejectNotes('');
      setShowRejectInput(false);
    } catch (error) {
      toast.error('Gagal menolak pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  // --- DEFINISI KOLOM TABEL DESKTOP ---
  const columns = [
    { header: 'ID Payment', render: r => <span className="font-bold text-gray-900">#{r.id}</span> },
    { header: 'Customer', render: r => <span className="font-medium text-gray-900">{r.user_name}</span> },
    { header: 'Jumlah', render: r => <span className="font-bold text-primary-600">{formatCurrency(r.amount)}</span> },
    { 
      header: 'Status', 
      render: r => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(r.status)}`}>
          {r.status}
        </span>
      ) 
    },
    {
      header: '',
      render: r => (
        <div className="flex justify-end">
            <button 
            onClick={() => { setSelectedPayment(r); setShowDetail(true); setShowRejectInput(false); }}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Lihat Detail"
            >
            <FiEye className="w-5 h-5" />
            </button>
        </div>
      )
    }
  ];

  // --- KONTEN MODAL DETAIL ---
  const DetailContent = ({ payment }) => (
    <div className="space-y-6">
      {/* Bukti Pembayaran */}
      <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Bukti Transfer</h4>
          <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center min-h-[200px]">
            {payment.payment_proof ? (
            <img 
                src={getPaymentProofUrl(payment.payment_proof)} 
                alt="Bukti Pembayaran" 
                className="w-full h-auto max-h-[400px] object-contain"
                onError={(e) => { e.target.src = null; e.target.parentNode.innerHTML = '<div class="flex flex-col items-center text-gray-400 p-4"><FiImage class="w-10 h-10 mb-2"/><p class="text-sm">Gagal memuat gambar</p></div>'; }}
            />
            ) : (
            <div className="flex flex-col items-center text-gray-400 p-4">
                <FiImage className="w-12 h-12 mb-2" />
                <p className="text-sm">Tidak ada bukti yang diunggah</p>
            </div>
            )}
        </div>
      </div>

      {/* Informasi Pembayaran */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
         <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Detail Transaksi</h4>
         <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
            <p className="text-gray-500 mb-1">Order ID</p>
            <p className="font-bold text-gray-900 text-lg">#{payment.order_id}</p>
            </div>
            <div>
            <p className="text-gray-500 mb-1">Jumlah Transfer</p>
            <p className="font-bold text-primary-600 text-lg">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
            <p className="text-gray-500 mb-1">Pengirim</p>
            <p className="font-medium text-gray-900">{payment.user_name}</p>
            </div>
            <div>
            <p className="text-gray-500 mb-1">Bank Asal</p>
            <p className="font-medium text-gray-900">{payment.bank_name} - {payment.account_number}</p>
            </div>
            <div>
             <p className="text-gray-500 mb-1">Status Saat Ini</p>
             <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>{payment.status}</span>
            </div>
            <div>
            <p className="text-gray-500 mb-1">Tanggal Upload</p>
            <p className="font-medium text-gray-900">{formatDateTime(payment.created_at)}</p>
            </div>
        </div>
      </div>
      
      {/* Tombol Aksi (Hanya jika status Menunggu Verifikasi) */}
      {payment.status === 'Menunggu Verifikasi' && (
        <div className="pt-4 border-t border-gray-100">
          {!showRejectInput ? (
            <div className="flex gap-3">
              <button 
                onClick={() => handleVerify(payment.id)} 
                disabled={processing}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                <FiCheck className="w-5 h-5" /> Verifikasi Sekarang
              </button>
              <button 
                onClick={() => setShowRejectInput(true)} 
                disabled={processing}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 py-3"
              >
                <FiX className="w-5 h-5" /> Tolak
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in bg-red-50 p-4 rounded-xl border border-red-100">
              <label className="block text-sm font-medium text-red-800">Alasan Penolakan</label>
              <textarea 
                placeholder="Contoh: Jumlah transfer tidak sesuai..." 
                className="input-field w-full bg-white border-red-200 focus:border-red-500 focus:ring-red-500"
                rows="3"
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectInput(false)} className="flex-1 btn-secondary bg-white py-2.5">Batal</button>
                <button onClick={handleReject} disabled={processing} className="flex-1 btn-danger py-2.5">Konfirmasi Tolak</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Simplified */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Konfirmasi Pembayaran</h1>
            <p className="text-sm text-gray-500 mt-1">Daftar bukti transfer yang perlu diperiksa.</p>
        </div>
        <button 
            onClick={fetchPayments} 
            disabled={loading}
            className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors shadow-sm"
            title="Refresh Data"
        >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
             <div className="flex items-center justify-center h-64">
             <Loader />
          </div>
        ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                <DataTable columns={columns} data={payments} loading={loading} emptyMessage="Tidak ada data pembayaran." />
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                {payments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <FiCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada pembayaran</p>
                    </div>
                ) : (
                    payments.map(p => (
                    <div key={p.id} onClick={() => { setSelectedPayment(p); setShowDetail(true); setShowRejectInput(false); }} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm active:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">#{p.id}</span>
                                <span className="text-sm text-gray-500 ml-1 font-medium">Order #{p.order_id}</span>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-gray-600">{p.user_name}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(p.created_at)}</p>
                            </div>
                            <span className="font-bold text-lg text-primary-600">{formatCurrency(p.amount)}</span>
                        </div>
                    </div>
                    ))
                )}
                </div>
            </>
        )}
      </div>

      {/* Detail Modal (Responsive) */}
      {(showDetail && selectedPayment) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-center backdrop-blur-sm" onClick={() => setShowDetail(false)}>
           <div className="bg-white w-full md:max-w-lg h-[90vh] md:h-auto md:max-h-[90vh] md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl animate-slide-up md:animate-scale-in" onClick={e => e.stopPropagation()}>
             <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                    <h2 className="text-xl font-bold text-gray-900">Detail Pembayaran</h2>
                    <p className="text-sm text-gray-500">ID: #{selectedPayment.id}</p>
               </div>
               <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><FiX className="w-6 h-6" /></button>
             </div>
             <div className="p-4 md:p-6 overflow-y-auto scrollbar-thin">
                <DetailContent payment={selectedPayment} />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Payments;