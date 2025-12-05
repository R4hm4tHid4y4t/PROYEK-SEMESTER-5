import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl, truncateText } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data.products.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
      title: 'Kualitas Premium',
      description: 'Selempang berkualitas tinggi dengan bahan pilihan terbaik'
    },
    {
      icon: <FiTruck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
      title: 'Pengiriman Cepat',
      description: 'Proses produksi dan pengiriman yang cepat ke seluruh Indonesia'
    },
    {
      icon: <FiShield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
      title: 'Garansi Kepuasan',
      description: 'Jaminan kualitas dan kepuasan pelanggan'
    },
    {
      icon: <FiStar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
      title: 'Custom Design',
      description: 'Desain khusus sesuai dengan kebutuhan Anda'
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="hero-pattern text-white py-10 sm:py-14 md:py-16 lg:py-20 xl:py-24">
        <ResponsiveContainer>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 lg:gap-12">
            <div className="text-center md:text-left md:flex-1 md:max-w-xl lg:max-w-2xl">
              <ResponsiveTypography.H1 className="mb-4 sm:mb-5 md:mb-6 animate-fade-in text-white">
                Selamat Datang di SelempangKu
              </ResponsiveTypography.H1>
              <ResponsiveTypography.Body className="mb-6 sm:mb-7 md:mb-8 text-gray-200 animate-slide-up">
                Pusat pemesanan selempang berkualitas untuk wisuda, perpisahan, dan berbagai keperluan lainnya.
              </ResponsiveTypography.Body>
            </div>
            <div className="hidden md:block md:flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl">
              <div className="relative">
                <div className="w-full h-48 md:h-56 lg:h-64 xl:h-72 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                  <FiShoppingBag className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Features Section */}
      <section className="py-10 sm:py-12 md:py-14 lg:py-16 xl:py-20 bg-gray-50">
        <ResponsiveContainer>
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <ResponsiveTypography.H2 className="text-gray-900">
              Mengapa Memilih Kami?
            </ResponsiveTypography.H2>
            <ResponsiveTypography.Body className="mt-2 sm:mt-3 md:mt-4 text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan layanan terbaik untuk kebutuhan selempang Anda
            </ResponsiveTypography.Body>
          </div>
          <ResponsiveGrid cols={4} gap={6}>
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow text-center p-4 sm:p-5 md:p-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary-100 text-primary-600 rounded-full mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                <ResponsiveTypography.Small className="text-gray-600 leading-relaxed">
                  {feature.description}
                </ResponsiveTypography.Small>
              </div>
            ))}
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>

      {/* Featured Products Section */}
      <section className="py-10 sm:py-12 md:py-14 lg:py-16 xl:py-20">
        <ResponsiveContainer>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
            <div className="text-center sm:text-left">
              <ResponsiveTypography.H2 className="text-gray-900">
                Produk Unggulan
              </ResponsiveTypography.H2>
              <ResponsiveTypography.Body className="mt-1 sm:mt-2 text-gray-600">
                Selempang terlaris dan paling diminati
              </ResponsiveTypography.Body>
            </div>
            <Link 
              to="/catalog" 
              className="inline-flex items-center justify-center sm:justify-start min-h-[44px] px-4 py-3 text-base text-primary-600 hover:text-primary-700 font-medium gap-2 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Lihat Semua <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <ResponsiveGrid cols={4} gap={6}>
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.id}`} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow group p-3 sm:p-4 md:p-5 w-full block"
                >
                  <div className="w-full overflow-hidden rounded-lg bg-gray-200 mb-3 sm:mb-4">
                    <ResponsiveImage
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-40 sm:h-44 md:h-48 lg:h-52 w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                    />
                  </div>
                  <span className="inline-block px-2 py-1 text-sm bg-primary-100 text-primary-600 rounded-full mb-2">
                    {product.category}
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <ResponsiveTypography.Small className="text-gray-500 mt-1 sm:mt-2 line-clamp-2 block">
                    {truncateText(product.description, 50)}
                  </ResponsiveTypography.Small>
                  <p className="text-lg md:text-xl font-bold text-primary-600 mt-2 sm:mt-3">
                    {formatCurrency(product.price)}
                  </p>
                  <button className="mt-3 sm:mt-4 w-full min-h-[44px] py-3 px-4 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors md:hidden">
                    Lihat Detail
                  </button>
                </Link>
              ))}
            </ResponsiveGrid>
          )}
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default Home;
