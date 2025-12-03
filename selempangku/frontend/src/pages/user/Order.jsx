import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiEdit3 } from 'react-icons/fi';
import { productService, accountService, orderService } from '../../services/api';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast.error('Pilih rekening tujuan pembayaran');
      return;
    }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={`/product/${productId}`} className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <FiArrowLeft className="mr-2" /> Kembali ke Detail Produk
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Form Pemesanan</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Product & Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Detail Produk</h2>
                <div className="flex gap-4">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Jumlah Pesanan</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiMinus />
                    </button>
                    <span className="px-6 py-3 font-medium">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">Stok tersedia: {product.stock}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">
                  <FiEdit3 className="inline mr-2" />
                  Catatan (Opsional)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Contoh: Warna merah, ukuran L, tambahkan nama di selempang"
                />
              </div>

              {/* Payment Account */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Pilih Rekening Tujuan</h2>
                <div className="space-y-3">
                  {accounts.length === 0 ? (
                    <p className="text-gray-500">Tidak ada rekening tersedia</p>
                  ) : (
                    accounts.map((account) => (
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
                          <p className="text-gray-600">{account.account_number}</p>
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right - Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({quantity} item)</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Ongkir</span>
                    <span>Gratis</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || accounts.length === 0}
                  className="btn-primary w-full mt-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Memproses...' : 'Buat Pesanan'}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Dengan menekan tombol di atas, Anda menyetujui syarat dan ketentuan kami.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Order;
