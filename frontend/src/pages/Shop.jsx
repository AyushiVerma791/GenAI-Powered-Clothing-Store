import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from '../components/common/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state from URL params
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load distinct categories on mount
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await productService.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCats();
  }, []);

  // Load products whenever search params change
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await productService.getProducts({
          query: query || undefined,
          category: category || undefined,
          min_price: minPrice ? parseFloat(minPrice) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          size: size || undefined,
          sort,
          page,
          limit: 12,
        });
        setProducts(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(query || category || minPrice || maxPrice || size || sort !== 'newest');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight">
            {category || 'All Collections'}
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            Showing {total} crafted garment{total === 1 ? '' : 's'} with verified stock and pricing
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <ArrowUpDown className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Sort:</span>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-medium"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => updateParam('category', '')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              !category
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All Pieces
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => updateParam('category', cat)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                category === cat
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Detailed Filters (Search, Price, Size) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
          {/* Keyword Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search keyword, tag..."
              value={query}
              onChange={(e) => updateParam('query', e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => updateParam('min_price', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
            />
            <span className="text-neutral-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => updateParam('max_price', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          {/* Size Select */}
          <div>
            <select
              value={size}
              onChange={(e) => updateParam('size', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white font-medium"
            >
              <option value="">Any Size</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-center">
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 py-1"
              >
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner text="Searching clothing inventory..." />
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 p-8 space-y-4">
          <SlidersHorizontal className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="font-serif text-2xl font-bold text-neutral-800">
            No matching garments found
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            We couldn&apos;t find any items matching your exact filters. Try broadening your price range, clearing selected sizes, or asking our AI shopping assistant.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-10">
          <button
            onClick={() => updateParam('page', Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 border border-neutral-200 rounded-lg disabled:opacity-30 hover:bg-neutral-50 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-700" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
            <button
              key={pNum}
              onClick={() => updateParam('page', pNum)}
              className={`w-9 h-9 text-xs font-semibold rounded-lg transition-colors ${
                page === pNum
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {pNum}
            </button>
          ))}

          <button
            onClick={() => updateParam('page', Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 border border-neutral-200 rounded-lg disabled:opacity-30 hover:bg-neutral-50 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-neutral-700" />
          </button>
        </div>
      )}
    </div>
  );
}
