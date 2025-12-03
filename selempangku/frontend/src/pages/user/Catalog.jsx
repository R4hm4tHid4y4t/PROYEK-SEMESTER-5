import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl, truncateText } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await productService.getAll(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Katalog Selempang</h1>
          <p className="mt-2 text-gray-600">Pilih selempang berkualitas sesuai kebutuhan Anda</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari selempang..."
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="btn-secondary flex items-center gap-2 md:hidden"
              >
                <FiFilter /> Filter
              </button>
              
              <div className={`${showFilter ? 'flex' : 'hidden'} md:flex gap-2 flex-wrap`}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-full md:w-48"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                {(search || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className="btn-secondary flex items-center gap-1"
                  >
                    <FiX /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <Loader />
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada produk ditemukan</p>
            <button onClick={clearFilters} className="btn-primary mt-4">
              Lihat Semua Produk
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">{products.length} produk ditemukan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="card hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold">Stok Habis</span>
                      </div>
                    )}
                  </div>
                  
                  <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-600 rounded-full mb-2">
                    {product.category}
                  </span>
                  
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {truncateText(product.description, 60)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-lg font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </p>
                    <span className="text-xs text-gray-500">
                      Stok: {product.stock}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Catalog;
