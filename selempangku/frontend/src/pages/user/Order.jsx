import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiEdit3, FiCheck, FiPackage, FiCreditCard, FiFileText, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { productService, accountService, orderService } from '../../services/api';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';

const Order = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(location.state?.quantity || 1);
  const [notes, setNotes] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const steps = [
    { id: 1, name: 'Produk', icon: FiPackage },
    { id: 2, name: 'Detail', icon: FiFileText },
    { id: 3, name: 'Pembayaran', icon: FiCreditCard },
  ];

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productRes, accountsRes] = await Promise.all([
        productService.getById(productId),
        accountService.getActive()
      ]);
      setProduct(productRes.data.product);
      setAccounts(accountsRes.data.accounts);
      if (accountsRes.data.accounts.length > 0) {
        setSelectedAccount(accountsRes.data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: null }));
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (quantity < 1) newErrors.quantity = 'Jumlah minimal 1';
      if (quantity > product?.stock) newErrors.quantity = 'Melebihi stok tersedia';
    }
    
    if (step === 3) {
      if (!selectedAccount) newErrors.account = 'Pilih rekening tujuan pembayaran';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      const response = await orderService.create({
        product_id: parseInt(productId),
        quantity,
        notes
      });
      
      toast.success('Pesanan berhasil dibuat!');
      navigate(`/payment/${response.data.order.id}`, { 
        state: { accountId: selectedAccount } 
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!product) {
    return null;
  }

  const totalPrice = product.price * quantity;

  const StepIndicator = () => (
    <div className="mb-6 sm:mb-8" role="navigation" aria-label="Order steps">
      {/* Mobile: Compact Horizontal Stepper */}
      <div className="flex md:hidden items-center justify-between bg-white rounded-xl shadow-sm p-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <FiCheck className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <p className={`mt-1.5 text-xs sm:text-sm font-medium text-center ${
                  isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tablet/Desktop: Horizontal Stepper */}
      <div className="hidden md:flex items-center justify-center bg-white rounded-xl shadow-sm p-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <FiCheck className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                </div>
                <p className={`mt-2 text-base font-medium ${
                  isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 lg:w-24 xl:w-32 h-1 mx-2 lg:mx-4 rounded ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const OrderSummaryCard = ({ className = '', showSubmitButton = false }) => (
    <div className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-3 sm:mb-4">Ringkasan Pesanan</h2>
      
      {/* Product Preview */}
      <div className="flex gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-200">
        <ResponsiveImage
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
          onError={(e) => { e.target.src = '/placeholder-product.png'; }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <ResponsiveTypography.Small className="text-gray-500">{product.category}</ResponsiveTypography.Small>
          <p className="text-base font-semibold text-primary-600 mt-1">
            {formatCurrency(product.price)} x {quantity}
          </p>
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between">
          <ResponsiveTypography.Small className="text-gray-600">Subtotal ({quantity} item)</ResponsiveTypography.Small>
          <ResponsiveTypography.Small className="font-medium">{formatCurrency(totalPrice)}</ResponsiveTypography.Small>
        </div>
        <div className="flex justify-between text-gray-400">
          <ResponsiveTypography.Small>Ongkir</ResponsiveTypography.Small>
          <ResponsiveTypography.Small>Gratis</ResponsiveTypography.Small>
        </div>
        <hr className="my-2 border-gray-200" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary-600">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      {showSubmitButton && (
        <>
          <button
            type="submit"
            disabled={submitting || accounts.length === 0}
            className="w-full min-h-[48px] mt-4 sm:mt-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>

          <ResponsiveTypography.Small className="text-gray-500 mt-3 sm:mt-4 text-center block">
            Dengan menekan tombol di atas, Anda menyetujui syarat dan ketentuan kami.
          </ResponsiveTypography.Small>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <ResponsiveContainer className="py-4 sm:py-6 md:py-8">
        {/* Back Link */}
        <Link 
          to={`/product/${productId}`} 
          className="inline-flex items-center min-h-[44px] px-3 py-2 -ml-3 text-base text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors mb-4 sm:mb-6"
        >
          <FiArrowLeft className="mr-2 w-5 h-5" /> 
          <span className="hidden sm:inline">Kembali ke Detail Produk</span>
          <span className="sm:hidden">Kembali</span>
        </Link>

        {/* Page Title */}
        <ResponsiveTypography.H2 className="text-gray-900 mb-4 sm:mb-6">
          Form Pemesanan
        </ResponsiveTypography.H2>

        {/* Step Indicator */}
        <StepIndicator />

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Left - Form Content */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
              
              {/* Step 1: Product Info & Quantity */}
              {currentStep === 1 && (
                <>
                  {/* Product Info Card */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
                    <h2 className="text-lg font-semibold mb-3 sm:mb-4">Detail Produk</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <ResponsiveImage
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full sm:w-28 md:w-32 h-32 sm:h-28 md:h-32 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <ResponsiveTypography.Small className="text-gray-500 mt-1 block">{product.category}</ResponsiveTypography.Small>
                        <p className="text-xl font-bold text-primary-600 mt-2">
                          {formatCurrency(product.price)}
                        </p>
                        <ResponsiveTypography.Small className="text-gray-500 mt-1 block">Stok: {product.stock}</ResponsiveTypography.Small>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Card */}
                  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
                    <h2 className="text-lg font-semibold mb-3 sm:mb-4">Jumlah Pesanan</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg self-start">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="w-5 h-5" />
                        </button>
                        <span className="px-4 sm:px-6 py-3 text-lg font-medium min-w-[60px] text-center border-x border-gray-300">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.stock}
                          className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="w-5 h-5" />
                        </button>
                      </div>
                      <ResponsiveTypography.Small className="text-gray-500">
                        Stok tersedia: {product.stock}
                      </ResponsiveTypography.Small>
                    </div>
                    {errors.quantity && (
                      <p className="mt-2 text-base text-red-600 flex items-center gap-1" role="alert">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full" aria-hidden="true"></span>
                        {errors.quantity}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Notes */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
                  <h2 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                    <FiEdit3 className="w-5 h-5" />
                    Catatan Pesanan
                    <ResponsiveTypography.Small className="font-normal text-gray-500">(Opsional)</ResponsiveTypography.Small>
                  </h2>
                  <label htmlFor="order-notes" className="sr-only">Catatan pesanan</label>
                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    className="w-full min-h-[120px] sm:min-h-[150px] p-3 sm:p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                    placeholder="Contoh: Warna merah, ukuran L, tambahkan nama di selempang"
                  />
                  <ResponsiveTypography.Small className="text-gray-500 mt-2 block">
                    Tambahkan detail khusus untuk pesanan Anda seperti warna, ukuran, atau personalisasi lainnya.
                  </ResponsiveTypography.Small>
                </div>
              )}

              {/* Step 3: Payment Account */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
                  <h2 className="text-lg font-semibold mb-3 sm:mb-4">Pilih Rekening Tujuan</h2>
                  {errors.account && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                      <p className="text-base text-red-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" aria-hidden="true"></span>
                        {errors.account}
                      </p>
                    </div>
                  )}
                  <fieldset>
                    <legend className="sr-only">Pilih rekening pembayaran</legend>
                    <div className="space-y-3" role="radiogroup">
                      {accounts.length === 0 ? (
                        <div className="text-center py-6 sm:py-8">
                          <ResponsiveTypography.Body className="text-gray-500">Tidak ada rekening tersedia</ResponsiveTypography.Body>
                        </div>
                      ) : (
                        accounts.map((account) => (
                          <label
                            key={account.id}
                            className={`flex items-start sm:items-center p-4 border rounded-lg cursor-pointer transition-colors min-h-[72px] ${
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
                              onChange={(e) => {
                                setSelectedAccount(parseInt(e.target.value));
                                if (errors.account) setErrors(prev => ({ ...prev, account: null }));
                              }}
                              className="sr-only"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900">{account.bank_name}</p>
                              <p className="text-base text-gray-600 font-mono">{account.account_number}</p>
                              <ResponsiveTypography.Small className="text-gray-500">a.n. {account.account_holder}</ResponsiveTypography.Small>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                              selectedAccount === account.id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`} aria-hidden="true">
                              {selectedAccount === account.id && (
                                <FiCheck className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="min-h-[44px] sm:min-h-[48px] px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors sm:flex-1 lg:flex-none lg:min-w-[140px]"
                  >
                    Sebelumnya
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="min-h-[44px] sm:min-h-[48px] px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex-1 lg:flex-none lg:min-w-[140px]"
                  >
                    Selanjutnya
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || accounts.length === 0}
                    className="min-h-[44px] sm:min-h-[48px] px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 lg:hidden"
                  >
                    {submitting ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                )}
              </div>
            </div>

            {/* Right - Order Summary (Desktop) */}
            <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
              <OrderSummaryCard className="sticky top-24" showSubmitButton={currentStep === 3} />
            </div>
          </div>

          {/* Mobile Order Summary - Fixed Bottom Sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-inset-bottom">
            {/* Expandable Summary */}
            {showMobileSummary && (
              <div className="border-b border-gray-100 p-4 animate-fade-in">
                <div className="flex gap-3 mb-3">
                  <ResponsiveImage
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h4>
                    <p className="text-sm text-gray-500">{formatCurrency(product.price)} x {quantity}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Ongkir</span>
                    <span>Gratis</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bottom Bar */}
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                  className="flex items-center gap-2 min-h-[44px] text-left"
                >
                  <div>
                    <p className="text-xs text-gray-500">Total Pembayaran</p>
                    <p className="text-lg font-bold text-primary-600">{formatCurrency(totalPrice)}</p>
                  </div>
                  {showMobileSummary ? (
                    <FiChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FiChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="min-h-[48px] px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Lanjutkan
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || accounts.length === 0}
                    className="min-h-[48px] px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Bottom padding for fixed mobile summary */}
        <div className="h-28 lg:hidden" />
      </ResponsiveContainer>
    </div>
  );
};

export default Order;
