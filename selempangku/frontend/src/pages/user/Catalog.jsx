import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiChevronDown } from 'react-icons/fi';
import { productService } from '../../services/api';
import { formatCurrency, getImageUrl, truncateText } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveTypography,
  ResponsiveImage,
} from '../../components/common/ResponsiveLayout';


const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const productsPerPage = 12;


  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);


  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
      setCurrentPage(1);
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
    setSortBy('newest');
  };


  const sortProducts = (productsToSort) => {
    const sorted = [...productsToSort];
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };


  const sortedProducts = sortProducts(products);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );


  const FilterContent = ({ onClose }) => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between md:hidden">
        <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Close filter"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
      
      <div>
        <h4 className="text-base font-medium text-gray-700 mb-2 sm:mb-3">Kategori</h4>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full text-left px-4 py-3 min-h-[44px] rounded-lg text-base transition-colors ${
              selectedCategory === '' 
                ? 'bg-primary-100 text-primary-700 font-medium' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left px-4 py-3 min-h-[44px] rounded-lg text-base transition-colors ${
                selectedCategory === category 
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>


      {(search || selectedCategory) && (
        <button
          onClick={() => {
            clearFilters();
            onClose?.();
          }}
          className="w-full min-h-[44px] py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-base"
        >
          <FiX className="w-4 h-4" /> Reset Filter
        </button>
      )}


      <button
        onClick={onClose}
        className="w-full min-h-[48px] py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors md:hidden text-base"
      >
        Terapkan Filter
      </button>
    </div>
  );


  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      {/* Mobile Filter Bottom Sheet */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileFilter(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up safe-area-inset-bottom">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
            <div className="p-4 sm:p-6 pb-8">
              <FilterContent onClose={() => setShowMobileFilter(false)} />
            </div>
          </div>
        </div>
      )}


      <ResponsiveContainer className="py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <ResponsiveTypography.H1 className="text-gray-900">
            Katalog Selempang
          </ResponsiveTypography.H1>
          <ResponsiveTypography.Body className="mt-2 text-gray-600">
            Pilih selempang berkualitas sesuai kebutuhan Anda
          </ResponsiveTypography.Body>
        </div>


        {/* Search Bar - Full width, NO sort dropdown on desktop */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Input Row - Full width on all devices */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari selempang..."
                  className="w-full min-h-[48px] pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Mobile Controls Row */}
            <div className="flex gap-2 sm:gap-3 md:hidden">
              {/* Mobile Sort Dropdown */}
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full min-h-[48px] pl-4 pr-10 py-3 text-base bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
                  aria-label="Sort products"
                >
                  <option value="newest">Terbaru</option>
                  <option value="price_low">Harga Terendah</option>
                  <option value="price_high">Harga Tertinggi</option>
                  <option value="name_asc">Nama A-Z</option>
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowMobileFilter(true)}
                className="min-h-[48px] min-w-[48px] px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-base"
                aria-label="Open filter"
              >
                <FiFilter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
                {selectedCategory && (
                  <span className="w-2 h-2 bg-primary-600 rounded-full" aria-hidden="true" />
                )}
              </button>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1" role="group" aria-label="View toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-56 lg:w-64 xl:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
              <FilterContent onClose={() => {}} />
            </div>
          </aside>


          {/* Products Section */}
          <main className="flex-1 min-w-0 overflow-x-hidden">
            {/* Results Count & View Toggle (Desktop) */}
            <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
              <ResponsiveTypography.Body className="text-gray-600">
                {sortedProducts.length} produk ditemukan
              </ResponsiveTypography.Body>
              <div className="hidden md:flex bg-gray-100 rounded-lg p-1" role="group" aria-label="View toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>


            {/* Products Grid/List */}
            {loading ? (
              <Loader />
            ) : products.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl">
                <ResponsiveTypography.Body className="text-gray-500">
                  Tidak ada produk ditemukan
                </ResponsiveTypography.Body>
                <button 
                  onClick={clearFilters} 
                  className="min-h-[48px] px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors mt-4 text-base"
                >
                  Lihat Semua Produk
                </button>
              </div>
            ) : (
              <>
                {/* Grid View - 1 col mobile, 2 tablet, 3-4 desktop */}
                {viewMode === 'grid' && (
                  <ResponsiveGrid cols={4} gap={6}>
                    {paginatedProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden p-3 sm:p-4 block"
                      >
                        <div className="relative overflow-hidden rounded-lg mb-3 sm:mb-4">
                          <ResponsiveImage
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="h-40 sm:h-44 md:h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                          />
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white font-bold text-base">Stok Habis</span>
                            </div>
                          )}
                        </div>
                        
                        <span className="inline-block px-2 py-1 text-sm bg-primary-100 text-primary-600 rounded-full mb-2">
                          {product.category}
                        </span>
                        
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <ResponsiveTypography.Small className="text-gray-500 mt-1 sm:mt-2 line-clamp-2 block">
                          {truncateText(product.description, 60)}
                        </ResponsiveTypography.Small>
                        
                        <div className="flex items-center justify-between mt-3 sm:mt-4">
                          <p className="text-lg md:text-xl font-bold text-primary-600">
                            {formatCurrency(product.price)}
                          </p>
                          <ResponsiveTypography.Small className="text-gray-500">
                            Stok: {product.stock}
                          </ResponsiveTypography.Small>
                        </div>


                        <button className="mt-3 sm:mt-4 w-full min-h-[48px] py-3 px-4 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors md:hidden">
                          Lihat Detail
                        </button>
                      </Link>
                    ))}
                  </ResponsiveGrid>
                )}


                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden p-3 sm:p-4 flex gap-3 sm:gap-4"
                      >
                        <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                          <ResponsiveImage
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                          />
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">Habis</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 text-sm bg-primary-100 text-primary-600 rounded-full mb-1">
                              {product.category}
                            </span>
                            
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            
                            <ResponsiveTypography.Small className="text-gray-500 mt-1 line-clamp-2 hidden sm:block">
                              {truncateText(product.description, 80)}
                            </ResponsiveTypography.Small>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-lg font-bold text-primary-600">
                              {formatCurrency(product.price)}
                            </p>
                            <ResponsiveTypography.Small className="text-gray-500">
                              Stok: {product.stock}
                            </ResponsiveTypography.Small>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}


                {/* Responsive Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4" aria-label="Pagination">
                    {/* Mobile: Simple prev/next */}
                    <div className="flex items-center gap-2 sm:hidden w-full">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex-1 min-h-[48px] px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                        aria-label="Previous page"
                      >
                        <FiChevronLeft /> Prev
                      </button>
                      <span className="px-4 py-2 text-base font-medium text-gray-700">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex-1 min-h-[48px] px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                        aria-label="Next page"
                      >
                        Next <FiChevronRight />
                      </button>
                    </div>


                    {/* Tablet/Desktop: Full pagination */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="min-h-[44px] min-w-[44px] p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                        aria-label="Previous page"
                      >
                        <FiChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400" aria-hidden="true">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`min-h-[44px] min-w-[44px] p-2 rounded-lg font-medium transition-colors text-base ${
                                currentPage === page
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                              aria-label={`Page ${page}`}
                              aria-current={currentPage === page ? 'page' : undefined}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="min-h-[44px] min-w-[44px] p-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                        aria-label="Next page"
                      >
                        <FiChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </ResponsiveContainer>
    </div>
  );
};


export default Catalog;