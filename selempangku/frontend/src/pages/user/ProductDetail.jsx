import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiArrowLeft, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getById(id);
      setProduct(response.data.product);
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

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/catalog" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <FiArrowLeft className="mr-2" /> Kembali ke Katalog
        </Link>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Product Image */}
            <div className="md:w-1/2">
              <img
                src={getImageUrl(product.image)}
                alt={product.name}
                className="w-full h-96 md:h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-product.png'; }}
              />
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-sm bg-primary-100 text-primary-600 rounded-full">
                  {product.category}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <p className="text-3xl font-bold text-primary-600 mb-6">
                {formatCurrency(product.price)}
              </p>

              <div className="prose prose-gray mb-6">
                <p className="text-gray-600">{product.description || 'Tidak ada deskripsi'}</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-600">Stok:</span>
                {product.stock > 0 ? (
                  <span className="flex items-center text-green-600">
                    <FiCheck className="mr-1" /> Tersedia ({product.stock})
                  </span>
                ) : (
                  <span className="text-red-600">Stok Habis</span>
                )}
              </div>

              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiMinus />
                      </button>
                      <span className="px-6 py-3 font-medium">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <span className="text-gray-500 text-sm">Maks. {product.stock}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Total Harga:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  disabled={product.stock === 0}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart />
                  {product.stock === 0 ? 'Stok Habis' : 'Pesan Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
