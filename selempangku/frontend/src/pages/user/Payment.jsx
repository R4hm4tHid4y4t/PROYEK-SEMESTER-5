import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUpload, FiArrowLeft, FiCopy, FiCheck, FiImage } from 'react-icons/fi';
import { orderService, paymentService, accountService } from '../../services/api';
import { formatCurrency, formatDateTime, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(location.state?.accountId || null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [orderRes, accountsRes] = await Promise.all([
        orderService.getById(orderId),
        accountService.getActive()
      ]);
      
      setOrder(orderRes.data.order);
      setAccounts(accountsRes.data.accounts);
      
      if (!selectedAccount && accountsRes.data.accounts.length > 0) {
        setSelectedAccount(accountsRes.data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data pesanan');
      navigate('/order-history');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setPaymentProof(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Nomor rekening disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentProof) {
      toast.error('Upload bukti pembayaran');
      return;
    }

    if (!selectedAccount) {
      toast.error('Pilih rekening tujuan');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('account_id', selectedAccount);
      formData.append('payment_proof', paymentProof);

      await paymentService.create(formData);
      toast.success('Bukti pembayaran berhasil diupload');
      navigate('/order-history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengupload bukti pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!order) {
    return null;
  }

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/order-history" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <FiArrowLeft className="mr-2" /> Kembali ke Riwayat Pesanan
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Bukti Pembayaran</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Detail Pesanan</h2>
              <div className="flex gap-4">
                <img
                  src={getImageUrl(order.product_image)}
                  alt={order.product_name}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                  <h3 className="font-semibold text-gray-900">{order.product_name}</h3>
                  <p className="text-sm text-gray-500">
                    {order.quantity} x {formatCurrency(order.product_price)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Select Account */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Transfer ke Rekening</h2>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <label
                    key={account.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount === account.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="account"
                      value={account.id}
                      checked={selectedAccount === account.id}
                      onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{account.bank_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-mono">{account.account_number}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(account.account_number)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">a.n. {account.account_holder}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAccount === account.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAccount === account.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload Proof */}
            <form onSubmit={handleSubmit} className="card">
              <h2 className="text-lg font-semibold mb-4">Upload Bukti Transfer</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setPreviewUrl(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Hapus & Ganti
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <FiImage className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Klik untuk upload atau drag & drop
                    </p>
                    <p className="text-sm text-gray-400">
                      JPG, PNG, PDF (Maks. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !paymentProof}
                className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiUpload />
                {submitting ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
              </button>
            </form>
          </div>

          {/* Right - Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Ringkasan Pembayaran</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(order.total_price)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Biaya Admin</span>
                  <span>Gratis</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Transfer</span>
                  <span className="text-primary-600">{formatCurrency(order.total_price)}</span>
                </div>
              </div>

              {selectedAccountData && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Transfer ke:</strong><br />
                    {selectedAccountData.bank_name}<br />
                    {selectedAccountData.account_number}<br />
                    a.n. {selectedAccountData.account_holder}
                  </p>
                </div>
              )}

              <div className="mt-6 text-xs text-gray-500">
                <p className="mb-2">Catatan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pastikan transfer sesuai jumlah</li>
                  <li>Simpan bukti transfer dengan jelas</li>
                  <li>Verifikasi maksimal 1x24 jam</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
