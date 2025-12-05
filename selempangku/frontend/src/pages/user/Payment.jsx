import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUpload, FiArrowLeft, FiCopy, FiCheck, FiImage, FiChevronDown, FiChevronUp, FiShield, FiLock, FiClock } from 'react-icons/fi';
import { orderService, paymentService, accountService } from '../../services/api';
import { formatCurrency, formatDateTime, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';

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
  const [expandedSection, setExpandedSection] = useState('account');

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

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!order) {
    return null;
  }

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  const AccordionSection = ({ id, title, icon: Icon, children, badge }) => {
    const isExpanded = expandedSection === id;
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden md:rounded-xl md:shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left md:cursor-default"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h2>
              {badge && !isExpanded && (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 md:hidden">{badge}</p>
              )}
            </div>
          </div>
          <div className="md:hidden">
            {isExpanded ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        <div className={`${isExpanded ? 'block' : 'hidden'} md:block border-t md:border-t-0`}>
          <div className="p-4 sm:p-5 pt-0 md:pt-0">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const OrderSummaryCard = ({ className = '', showMobileVersion = false }) => (
    <div className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Ringkasan Pembayaran</h2>
      
      {/* Product Preview */}
      <div className="flex gap-3 mb-4 pb-4 border-b">
        <ResponsiveImage
          src={getImageUrl(order.product_image)}
          alt={order.product_name}
          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
          onError={(e) => { e.target.src = '/placeholder-product.png'; }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Order #{order.id}</p>
          <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">{order.product_name}</h3>
          <p className="text-xs sm:text-sm text-gray-500">
            {order.quantity} x {formatCurrency(order.product_price)}
          </p>
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(order.total_price)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Biaya Admin</span>
          <span>Gratis</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between text-base sm:text-lg font-bold">
          <span>Total Transfer</span>
          <span className="text-primary-600">{formatCurrency(order.total_price)}</span>
        </div>
      </div>

      {selectedAccountData && (
        <div className="mt-4 p-3 sm:p-4 bg-yellow-50 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-800">
            <strong className="block mb-1">Transfer ke:</strong>
            <span className="font-medium">{selectedAccountData.bank_name}</span><br />
            <span className="font-mono">{selectedAccountData.account_number}</span><br />
            <span className="text-yellow-700">a.n. {selectedAccountData.account_holder}</span>
          </p>
        </div>
      )}

      {!showMobileVersion && (
        <div className="mt-4 sm:mt-6 text-xs text-gray-500">
          <p className="mb-2 font-medium">Catatan:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pastikan transfer sesuai jumlah</li>
            <li>Simpan bukti transfer dengan jelas</li>
            <li>Verifikasi maksimal 1x24 jam</li>
          </ul>
        </div>
      )}
    </div>
  );

  const SecurityInfoCard = ({ className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold mb-4">Keamanan Transaksi</h2>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FiShield className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Transaksi Aman</h3>
            <p className="text-xs text-gray-500 mt-0.5">Data pembayaran Anda terlindungi dengan enkripsi</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FiLock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Privasi Terjaga</h3>
            <p className="text-xs text-gray-500 mt-0.5">Informasi pribadi tidak dibagikan ke pihak ketiga</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FiClock className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Verifikasi Cepat</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pembayaran diverifikasi dalam 1x24 jam kerja</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Butuh bantuan? Hubungi customer service kami di jam kerja (09:00 - 17:00 WIB)
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <ResponsiveContainer className="py-4 sm:py-6 md:py-8">
        {/* Back Link */}
        <Link 
          to="/order-history" 
          className="inline-flex items-center min-h-[44px] px-3 py-2 -ml-3 text-base text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors mb-4 sm:mb-6"
        >
          <FiArrowLeft className="mr-2 w-5 h-5" /> 
          <span className="hidden sm:inline">Kembali ke Riwayat Pesanan</span>
          <span className="sm:hidden">Kembali</span>
        </Link>

        {/* Page Title */}
        <ResponsiveTypography.H2 className="text-gray-900 mb-4 sm:mb-6">
          Upload Bukti Pembayaran
        </ResponsiveTypography.H2>

        {/* Mobile: Order Summary at Top */}
        <div className="md:hidden mb-4">
          <div className="bg-primary-600 text-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-200">Total Pembayaran</p>
                <p className="text-xl font-bold">{formatCurrency(order.total_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-200">Order #{order.id}</p>
                <p className="text-sm">{order.product_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Payment Form */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            {/* Mobile: Accordion Style | Desktop: Card Style */}
            
            {/* Order Details - Always visible on tablet+ */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Detail Pesanan</h2>
              <div className="flex gap-4">
                <ResponsiveImage
                  src={getImageUrl(order.product_image)}
                  alt={order.product_name}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">{order.product_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.quantity} x {formatCurrency(order.product_price)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Select Account - Accordion on mobile */}
            <AccordionSection 
              id="account" 
              title="Pilih Rekening Tujuan" 
              icon={FiCopy}
              badge={selectedAccountData?.bank_name}
            >
              <div className="space-y-3 mt-3 md:mt-0">
                {accounts.map((account) => (
                  <label
                    key={account.id}
                    className={`flex items-start sm:items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors min-h-[72px] ${
                      selectedAccount === account.id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{account.bank_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-base sm:text-lg font-mono">{account.account_number}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            copyToClipboard(account.account_number);
                          }}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded-md transition-colors"
                        >
                          {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">a.n. {account.account_holder}</p>
                    </div>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                      selectedAccount === account.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAccount === account.id && (
                        <FiCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </AccordionSection>

            {/* Upload Proof - Accordion on mobile */}
            <AccordionSection 
              id="upload" 
              title="Upload Bukti Transfer" 
              icon={FiUpload}
              badge={paymentProof ? 'File dipilih' : 'Belum upload'}
            >
              <form onSubmit={handleSubmit} className="mt-3 md:mt-0">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary-400 transition-colors">
                  {previewUrl ? (
                    <div className="space-y-3 sm:space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 sm:max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProof(null);
                          setPreviewUrl(null);
                        }}
                        className="min-h-[44px] px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Hapus & Ganti
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <FiImage className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                        Klik untuk upload atau drag & drop
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        JPG, PNG (Maks. 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Desktop Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !paymentProof}
                  className="hidden md:flex w-full min-h-[48px] mt-4 sm:mt-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiUpload className="w-5 h-5" />
                  {submitting ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </AccordionSection>

            {/* Mobile: Security Info */}
            <div className="md:hidden">
              <SecurityInfoCard />
            </div>
          </div>

          {/* Middle Column - Order Summary (Tablet) */}
          <div className="hidden md:block lg:hidden w-72 flex-shrink-0">
            <OrderSummaryCard className="sticky top-24" />
          </div>

          {/* Right Columns - Desktop Only */}
          <div className="hidden lg:flex lg:flex-col lg:gap-6 w-80 xl:w-96 flex-shrink-0">
            <OrderSummaryCard className="sticky top-24" />
          </div>

          {/* Far Right Column - Security Info (Desktop XL only) */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <SecurityInfoCard className="sticky top-24" />
          </div>
        </div>

        {/* Mobile Fixed Bottom Submit */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Total Pembayaran</p>
              <p className="text-lg font-bold text-primary-600">{formatCurrency(order.total_price)}</p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !paymentProof}
              className="min-h-[44px] px-5 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiUpload className="w-5 h-5" />
              {submitting ? 'Uploading...' : 'Kirim'}
            </button>
          </div>
        </div>

        {/* Bottom padding for fixed mobile bar */}
        <div className="h-24 md:hidden" />
      </ResponsiveContainer>
    </div>
  );
};

export default Payment;
