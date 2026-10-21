import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80';
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      const defaultSize = product.sizes?.[0] || 'M';
      const defaultColor = product.colors?.[0] || 'Default';
      await addToCart(product.id, 1, defaultSize, defaultColor);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300">
      <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded">
              Featured
            </span>
          )}
          {product.original_price && product.original_price > product.price && (
            <span className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick Add overlay button */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-neutral-900 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-neutral-900 hover:text-white"
            title="Quick add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1">
            {product.category}
          </p>
          <Link to={`/products/${product.id}`} className="hover:text-amber-800 transition-colors">
            <h3 className="font-medium text-sm text-neutral-900 line-clamp-1 mb-1">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-medium text-neutral-600">
              {product.rating?.toFixed(1) || '5.0'}
            </span>
            <span className="text-xs text-neutral-400">
              ({product.reviews_count || 12})
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-100">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-neutral-900">
              ${product.price.toFixed(2)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>
          {added && (
            <span className="text-xs font-semibold text-emerald-600 animate-pulse">
              Added!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
