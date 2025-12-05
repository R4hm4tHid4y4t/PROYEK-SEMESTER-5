import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiCheck, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl, truncateText } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';

const ImageGallery = ({ images, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const galleryRef = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <div
        ref={galleryRef}
        className="relative aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <ResponsiveImage
                src={getImageUrl(image)}
                alt={`${productName} - ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-product.png'; }}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-white/90 hover:bg-white rounded-full shadow-lg items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Previous image"
            >
              <FiChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] bg-white/90 hover:bg-white rounded-full shadow-lg items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Next image"
            >
              <FiChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </>
        )}

        {/* Image Counter - Mobile */}
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-3 md:mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`min-h-[44px] min-w-[44px] md:min-h-[32px] md:min-w-[32px] flex items-center justify-center`}
              aria-label={`Go to image ${index + 1}`}
            >
              <span
                className={`w-2.5 h-2.5 md:w-2 md:h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Thumbnail Strip - Desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary-600 ring-2 ring-primary-200'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <ResponsiveImage
                src={getImageUrl(image)}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-product.png'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [expandedMobileTab, setExpandedMobileTab] = useState('description');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getById(id);
      setProduct(response.data.product);
      
      // Fetch related products
      try {
        const relatedResponse = await productService.getAll({ 
          category: response.data.product.category,
          limit: 4 
        });
        setRelatedProducts(
          relatedResponse.data.products
            .filter(p => p.id !== parseInt(id))
            .slice(0, 4)
        );
      } catch (e) {
        console.error('Error fetching related products:', e);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Produk tidak ditemukan');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleOrder = () => {
    if (!isAuthenticated) {
      toast.info('Silakan login terlebih dahulu');
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }

    if (product.stock === 0) {
      toast.error('Stok produk habis');
      return;
    }

    navigate(`/order/${id}`, { state: { quantity } });
  };

  const toggleMobileTab = (tab) => {
    setExpandedMobileTab(expandedMobileTab === tab ? '' : tab);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!product) {
    return null;
  }

  const tabs = [
    { id: 'description', label: 'Deskripsi' },
    { id: 'details', label: 'Detail Produk' },
    { id: 'shipping', label: 'Pengiriman' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 py-4 sm:py-6 md:py-8">
      <ResponsiveContainer>
        {/* Back Button - Touch friendly */}
        <Link 
          to="/catalog" 
          className="inline-flex items-center min-h-[44px] px-3 py-2 text-base text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors mb-4 sm:mb-6"
        >
          <FiArrowLeft className="mr-2 h-5 w-5" /> Kembali ke Katalog
        </Link>

        {/* Main Product Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Product Image Gallery - Full width on mobile, swipeable */}
            <div className="w-full lg:w-1/2 p-3 sm:p-4 lg:p-6">
              <div className="relative">
                <ImageGallery 
                  images={product.images?.length > 0 ? product.images : [product.image]} 
                  productName={product.name} 
                />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg pointer-events-none">
                    <span className="text-white font-bold text-xl sm:text-2xl">Stok Habis</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-8">
              {/* Category Badge */}
              <div className="mb-3 sm:mb-4">
                <span className="inline-block px-3 py-1.5 text-sm bg-primary-100 text-primary-600 rounded-full font-medium">
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <ResponsiveTypography.H2 className="text-gray-900 mb-3 sm:mb-4">
                {product.name}
              </ResponsiveTypography.H2>
              
              {/* Price */}
              <p className="text-2xl sm:text-3xl font-bold text-primary-600 mb-4 sm:mb-6">
                {formatCurrency(product.price)}
              </p>

              {/* Short Description - Visible on mobile */}
              <div className="mb-4 sm:mb-6 lg:hidden">
                <ResponsiveTypography.Body className="text-gray-600">
                  {truncateText(product.description, 150) || 'Tidak ada deskripsi'}
                </ResponsiveTypography.Body>
              </div>

              {/* Full Description - Hidden on mobile */}
              <div className="hidden lg:block mb-6">
                <ResponsiveTypography.Body className="text-gray-600">
                  {product.description || 'Tidak ada deskripsi'}
                </ResponsiveTypography.Body>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <ResponsiveTypography.Body className="text-gray-600">Stok:</ResponsiveTypography.Body>
                {product.stock > 0 ? (
                  <span className="flex items-center text-green-600 text-base font-medium">
                    <FiCheck className="mr-1 h-5 w-5" /> Tersedia ({product.stock})
                  </span>
                ) : (
                  <span className="text-red-600 text-base font-medium">Stok Habis</span>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="min-h-[48px] min-w-[48px] p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <FiMinus className="h-5 w-5" />
                      </button>
                      <span className="min-w-[60px] px-4 py-3 text-center text-lg font-medium border-x border-gray-300">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock}
                        className="min-h-[48px] min-w-[48px] p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <FiPlus className="h-5 w-5" />
                      </button>
                    </div>
                    <ResponsiveTypography.Small className="text-gray-500">
                      Maks. {product.stock}
                    </ResponsiveTypography.Small>
                  </div>
                </div>
              )}

              {/* Total & Order Button */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-4">
                  <ResponsiveTypography.Body className="text-gray-600">Total Harga:</ResponsiveTypography.Body>
                  <span className="text-xl sm:text-2xl font-bold text-primary-600">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={product.stock === 0}
                  className="w-full min-h-[52px] py-3 sm:py-4 px-6 bg-primary-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <FiShoppingCart className="h-5 w-5" />
                  {product.stock === 0 ? 'Stok Habis' : 'Pesan Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Desktop */}
        <div className="hidden md:block mt-6 sm:mt-8 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex" aria-label="Product information tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[48px] px-6 py-4 text-base font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-primary-600 bg-primary-50'
                      : 'text-gray-600 border-transparent hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <ResponsiveTypography.Body className="text-gray-600">
                {product.description || 'Tidak ada deskripsi untuk produk ini.'}
              </ResponsiveTypography.Body>
            )}
            {activeTab === 'details' && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <ResponsiveTypography.Body className="text-gray-600">Kategori</ResponsiveTypography.Body>
                  <ResponsiveTypography.Body className="font-medium text-gray-900">{product.category}</ResponsiveTypography.Body>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <ResponsiveTypography.Body className="text-gray-600">Stok Tersedia</ResponsiveTypography.Body>
                  <ResponsiveTypography.Body className="font-medium text-gray-900">{product.stock} unit</ResponsiveTypography.Body>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <ResponsiveTypography.Body className="text-gray-600">Harga Satuan</ResponsiveTypography.Body>
                  <ResponsiveTypography.Body className="font-medium text-gray-900">{formatCurrency(product.price)}</ResponsiveTypography.Body>
                </div>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <ResponsiveTypography.Body className="text-gray-600">
                  Produk akan diproses dalam 1-3 hari kerja setelah pembayaran dikonfirmasi.
                </ResponsiveTypography.Body>
                <ResponsiveTypography.Body className="text-gray-600">
                  Pengiriman dilakukan ke seluruh Indonesia melalui jasa ekspedisi terpercaya.
                </ResponsiveTypography.Body>
              </div>
            )}
          </div>
        </div>

        {/* Accordion Section - Mobile */}
        <div className="md:hidden mt-4 sm:mt-6 space-y-2">
          {tabs.map((tab) => (
            <div key={tab.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleMobileTab(tab.id)}
                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left"
                aria-expanded={expandedMobileTab === tab.id}
              >
                <span className="text-base font-medium text-gray-900">{tab.label}</span>
                {expandedMobileTab === tab.id ? (
                  <FiChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <FiChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedMobileTab === tab.id && (
                <div className="px-4 pb-4">
                  {tab.id === 'description' && (
                    <ResponsiveTypography.Body className="text-gray-600">
                      {product.description || 'Tidak ada deskripsi untuk produk ini.'}
                    </ResponsiveTypography.Body>
                  )}
                  {tab.id === 'details' && (
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <ResponsiveTypography.Small className="text-gray-600">Kategori</ResponsiveTypography.Small>
                        <ResponsiveTypography.Small className="font-medium text-gray-900">{product.category}</ResponsiveTypography.Small>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <ResponsiveTypography.Small className="text-gray-600">Stok Tersedia</ResponsiveTypography.Small>
                        <ResponsiveTypography.Small className="font-medium text-gray-900">{product.stock} unit</ResponsiveTypography.Small>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <ResponsiveTypography.Small className="text-gray-600">Harga Satuan</ResponsiveTypography.Small>
                        <ResponsiveTypography.Small className="font-medium text-gray-900">{formatCurrency(product.price)}</ResponsiveTypography.Small>
                      </div>
                    </div>
                  )}
                  {tab.id === 'shipping' && (
                    <div className="space-y-3">
                      <ResponsiveTypography.Small className="text-gray-600 block">
                        Produk akan diproses dalam 1-3 hari kerja setelah pembayaran dikonfirmasi.
                      </ResponsiveTypography.Small>
                      <ResponsiveTypography.Small className="text-gray-600 block">
                        Pengiriman dilakukan ke seluruh Indonesia melalui jasa ekspedisi terpercaya.
                      </ResponsiveTypography.Small>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-10 md:mt-12">
            <ResponsiveTypography.H3 className="text-gray-900 mb-4 sm:mb-6">
              Produk Terkait
            </ResponsiveTypography.H3>
            <ResponsiveGrid cols={4} gap={6}>
              {relatedProducts.map((relProduct) => (
                <Link
                  key={relProduct.id}
                  to={`/product/${relProduct.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden p-3 sm:p-4 block"
                >
                  <div className="w-full overflow-hidden rounded-lg bg-gray-200 mb-3">
                    <ResponsiveImage
                      src={getImageUrl(relProduct.image)}
                      alt={relProduct.name}
                      className="h-32 sm:h-36 md:h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                    />
                  </div>
                  <span className="inline-block px-2 py-1 text-sm bg-primary-100 text-primary-600 rounded-full mb-2">
                    {relProduct.category}
                  </span>
                  <h4 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {relProduct.name}
                  </h4>
                  <p className="text-lg font-bold text-primary-600 mt-2">
                    {formatCurrency(relProduct.price)}
                  </p>
                  <button className="mt-3 w-full min-h-[44px] py-2.5 px-4 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors md:hidden">
                    Lihat Detail
                  </button>
                </Link>
              ))}
            </ResponsiveGrid>
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ProductDetail;
