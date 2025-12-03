import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl, truncateText } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

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
      icon: <FiShoppingBag className="w-8 h-8" />,
      title: 'Kualitas Premium',
      description: 'Selempang berkualitas tinggi dengan bahan pilihan terbaik'
    },
    {
      icon: <FiTruck className="w-8 h-8" />,
      title: 'Pengiriman Cepat',
      description: 'Proses produksi dan pengiriman yang cepat ke seluruh Indonesia'
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: 'Garansi Kepuasan',
      description: 'Jaminan kualitas dan kepuasan pelanggan'
    },
    {
      icon: <FiStar className="w-8 h-8" />,
      title: 'Custom Design',
      description: 'Desain khusus sesuai dengan kebutuhan Anda'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-pattern text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Selamat Datang di SelempangKu
            </h1>
            <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto animate-slide-up">
              Pusat pemesanan selempang berkualitas untuk wisuda, perpisahan, dan berbagai keperluan lainnya.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Mengapa Memilih Kami?</h2>
            <p className="mt-4 text-gray-600">Kami menyediakan layanan terbaik untuk kebutuhan selempang Anda</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Produk Unggulan</h2>
              <p className="mt-2 text-gray-600">Selempang terlaris dan paling diminati</p>
            </div>
            <Link to="/catalog" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              Lihat Semua <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="card hover:shadow-lg transition-shadow group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                    />
                  </div>
                  <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-600 rounded-full mb-2">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{truncateText(product.description, 50)}</p>
                  <p className="text-lg font-bold text-primary-600 mt-2">{formatCurrency(product.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;
