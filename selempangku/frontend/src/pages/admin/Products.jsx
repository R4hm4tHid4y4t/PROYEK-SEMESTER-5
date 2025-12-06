import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiGrid, FiList, FiSearch, FiFilter, FiMoreVertical, FiPackage, FiCheck, FiCheckSquare, FiSquare, FiUploadCloud } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { 
  ResponsiveTableWrapper, 
  ResponsiveGrid, 
  ResponsiveImage 
} from '../../components/common/ResponsiveLayout';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [mobileViewMode, setMobileViewMode] = useState('list'); // Separate mobile view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    is_active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, filterCategory, filterStatus]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllAdmin();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterCategory) {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    
    if (filterStatus !== '') {
      filtered = filtered.filter(p => p.is_active === (filterStatus === 'active'));
    }
    
    setFilteredProducts(filtered);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category || '',
        is_active: product.is_active
      });
      setImagePreview(product.image ? getImageUrl(product.image) : null);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        is_active: true
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
    setShowActionMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);
      data.append('is_active', formData.is_active);
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, data);
        toast.success('Produk berhasil diperbarui');
      } else {
        await productService.create(data);
        toast.success('Produk berhasil ditambahkan');
      }

      closeModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      await productService.delete(id);
      toast.success('Produk berhasil dihapus');
      fetchProducts();
    } catch (error) {
      toast.error('Gagal menghapus produk');
    }
    setShowActionMenu(null);
  };

  // Bulk selection handlers
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedProducts.length} produk?`)) return;

    try {
      await Promise.all(selectedProducts.map(id => productService.delete(id)));
      toast.success(`${selectedProducts.length} produk berhasil dihapus`);
      setSelectedProducts([]);
      setShowBulkActions(false);
      fetchProducts();
    } catch (error) {
      toast.error('Gagal menghapus beberapa produk');
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedProducts.length === 0) return;

    try {
      await Promise.all(selectedProducts.map(id => 
        productService.update(id, { is_active: status })
      ));
      toast.success(`${selectedProducts.length} produk berhasil diperbarui`);
      setSelectedProducts([]);
      setShowBulkActions(false);
      fetchProducts();
    } catch (error) {
      toast.error('Gagal memperbarui status produk');
    }
  };

  // Drag and drop handlers for image upload
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Ukuran file maksimal 5MB');
          return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        toast.error('File harus berupa gambar');
      }
    }
  }, []);

  const ProductCard = ({ product, selectable = false }) => {
    const isSelected = selectedProducts.includes(product.id);
    
    return (
      <div className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}>
        <div className="relative">
          <ResponsiveImage
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-32 sm:h-40 object-cover"
            onError={(e) => { e.target.src = '/placeholder-product.png'; }}
          />
          {/* Selection checkbox */}
          {selectable && (
            <button
              onClick={() => toggleProductSelection(product.id)}
              className="absolute top-2 left-2 min-w-[44px] min-h-[44px] p-2 bg-white/90 rounded-lg shadow-sm flex items-center justify-center"
            >
              {isSelected ? (
                <FiCheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <FiSquare className="w-5 h-5 text-gray-400" />
              )}
            </button>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-sm font-medium rounded-full ${
              product.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {product.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{product.category || 'Tanpa Kategori'}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(showActionMenu === product.id ? null : product.id)}
                className="min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiMoreVertical className="w-5 h-5" />
              </button>
              {showActionMenu === product.id && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => openModal(product)}
                    className="w-full min-h-[44px] px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiEdit2 className="w-5 h-5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-full min-h-[44px] px-4 py-2 text-left text-base text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FiTrash2 className="w-5 h-5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-base font-semibold text-primary-600">{formatCurrency(product.price)}</p>
            <p className={`text-sm ${product.stock === 0 ? 'text-red-600' : 'text-gray-500'}`}>
              Stok: {product.stock}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ProductListItem = ({ product, selectable = false }) => {
    const isSelected = selectedProducts.includes(product.id);
    
    return (
      <div className={`bg-white rounded-xl shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4 hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}>
        {/* Selection checkbox */}
        {selectable && (
          <button
            onClick={() => toggleProductSelection(product.id)}
            className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center flex-shrink-0"
          >
            {isSelected ? (
              <FiCheckSquare className="w-6 h-6 text-primary-600" />
            ) : (
              <FiSquare className="w-6 h-6 text-gray-400" />
            )}
          </button>
        )}
        <ResponsiveImage
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
          onError={(e) => { e.target.src = '/placeholder-product.png'; }}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-base text-gray-900 line-clamp-1">{product.name}</h3>
              <span className={`px-2 py-0.5 text-sm font-medium rounded-full flex-shrink-0 ${
                product.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {product.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{product.category || 'Tanpa Kategori'}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-primary-600">{formatCurrency(product.price)}</p>
              <p className={`text-sm ${product.stock === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                Stok: {product.stock}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openModal(product)}
                className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="min-w-[44px] min-h-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProductModal = () => (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="hidden md:block absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Mobile: Full screen | Desktop: Center modal */}
      <div className="absolute inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="bg-white w-full h-full md:h-auto md:rounded-xl md:max-w-2xl md:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
            </div>
            <button 
              onClick={closeModal} 
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-5 space-y-4">
              {/* Image Upload - Touch-friendly dropzone */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Gambar Produk</label>
                <div 
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                    isDragging 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {imagePreview ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg" 
                      />
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <label className="min-h-[44px] px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2">
                          <FiImage className="w-5 h-5" />
                          Ganti Gambar
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="min-h-[44px] px-4 py-2.5 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <FiTrash2 className="w-5 h-5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-6 min-h-[120px] justify-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        isDragging ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                        <FiUploadCloud className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
                      </div>
                      <span className="text-sm text-gray-600 font-medium text-center">
                        {isDragging ? 'Lepaskan gambar di sini' : 'Klik atau seret gambar ke sini'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG (Maks. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Masukkan nama produk"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1.5">Harga</label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full min-h-[44px] px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1.5">Stok</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full min-h-[44px] px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Kategori</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Contoh: Wisuda, Paskibra"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full min-h-[100px] px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  placeholder="Deskripsi produk (opsional)"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-h-[44px]">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-base font-medium text-gray-700">
                  Produk Aktif (tampil di katalog)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button 
                type="button" 
                onClick={closeModal} 
                className="min-h-[44px] px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors sm:flex-1"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="min-h-[44px] px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 sm:flex-1"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{products.length} produk terdaftar</p>
        </div>
        {/* Desktop Add Button */}
        <button 
          onClick={() => openModal()} 
          className="hidden sm:flex min-h-[44px] px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors items-center gap-2"
        >
          <FiPlus className="w-5 h-5" /> Tambah Produk
        </button>
      </div>

      {/* Bulk Actions Bar - Shows when items are selected */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProducts([])}
              className="min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-primary-700">
              {selectedProducts.length} produk dipilih
            </span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleBulkStatusChange(true)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-4 h-4" /> Aktifkan
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiX className="w-4 h-4" /> Nonaktifkan
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 space-y-3">
        <div className="flex gap-2 sm:gap-3">
          {/* Bulk Select Toggle */}
          <button
            onClick={toggleSelectAll}
            className={`min-h-[44px] min-w-[44px] px-3 border rounded-lg transition-colors flex items-center justify-center ${
              selectedProducts.length > 0
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            title="Pilih Semua"
          >
            {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
              <FiCheckSquare className="w-5 h-5" />
            ) : (
              <FiSquare className="w-5 h-5" />
            )}
          </button>

          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`min-h-[44px] min-w-[44px] px-3 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters || filterCategory || filterStatus 
                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiFilter className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Filter</span>
          </button>

          {/* Mobile View Toggle */}
          <div className="md:hidden flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMobileViewMode('list')}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-md transition-colors ${
                mobileViewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileViewMode('grid')}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-md transition-colors ${
                mobileViewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop View Toggle */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="min-h-[44px] px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-h-[44px] px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            {(filterCategory || filterStatus) && (
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterStatus('');
                }}
                className="min-h-[44px] px-3 py-2 text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <FiPackage className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery || filterCategory || filterStatus ? 'Tidak ada produk ditemukan' : 'Belum ada produk'}
          </h3>
          <p className="text-base text-gray-500 mb-4">
            {searchQuery || filterCategory || filterStatus 
              ? 'Coba ubah filter pencarian Anda' 
              : 'Mulai tambahkan produk pertama Anda'}
          </p>
          {!searchQuery && !filterCategory && !filterStatus && (
            <button
              onClick={() => openModal()}
              className="min-h-[44px] px-6 py-2 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" /> Tambah Produk
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: List or Grid View with toggle */}
          <div className="md:hidden">
            {mobileViewMode === 'list' ? (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductListItem key={product.id} product={product} selectable={selectedProducts.length > 0} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} selectable={selectedProducts.length > 0} />
                ))}
              </div>
            )}
          </div>

          {/* Tablet+: Grid or List View */}
          <div className="hidden md:block">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} selectable={selectedProducts.length > 0} />
                ))}
              </div>
            ) : (
              /* Desktop Table View with ResponsiveTableWrapper */
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <ResponsiveTableWrapper>
                  <table className="w-full text-base">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 py-3 px-4">
                          <button
                            onClick={toggleSelectAll}
                            className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center"
                          >
                            {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                              <FiCheckSquare className="w-5 h-5 text-primary-600" />
                            ) : (
                              <FiSquare className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Produk</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Harga</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Stok</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProducts.map((product) => {
                        const isSelected = selectedProducts.includes(product.id);
                        return (
                          <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50' : ''}`}>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleProductSelection(product.id)}
                                className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center"
                              >
                                {isSelected ? (
                                  <FiCheckSquare className="w-5 h-5 text-primary-600" />
                                ) : (
                                  <FiSquare className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <ResponsiveImage
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                  onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500 line-clamp-1 max-w-[200px]">
                                    {product.description || 'Tidak ada deskripsi'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{product.category || '-'}</td>
                            <td className="py-3 px-4 font-medium">{formatCurrency(product.price)}</td>
                            <td className="py-3 px-4">
                              <span className={product.stock === 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${
                                product.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {product.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openModal(product)}
                                  className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                                >
                                  <FiEdit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="min-w-[44px] min-h-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ResponsiveTableWrapper>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile FAB Add Button */}
      <button
        onClick={() => openModal()}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-30"
      >
        <FiPlus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showModal && <ProductModal />}
    </div>
  );
};

export default Products; 