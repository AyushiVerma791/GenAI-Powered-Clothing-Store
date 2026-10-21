import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingBag, ShieldCheck, Truck, Sparkles, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { quickAsk } = useChat();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        const data = await productService.getProductById(id);
        setProduct(data);
        setSelectedImage(data.images?.[0] || '/placeholder.png');
        setSelectedSize(data.sizes?.[0] || 'M');
        setSelectedColor(data.colors?.[0] || 'Default');
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading garment details..." />;
  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ErrorAlert message={error || 'Product not found'} />
        <Link
          to="/shop"
          className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:text-amber-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;
    try {
      setAdding(true);
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
        <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-neutral-900 transition-colors">Shop</Link>
        <span>/</span>
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-neutral-900 transition-colors"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold truncate">{product.title}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm relative">
            <img
              src={selectedImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {product.original_price && product.original_price > product.price && (
              <span className="absolute top-4 left-4 bg-amber-600 text-white text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
                Sale
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img
                      ? 'border-neutral-900 shadow-md scale-95'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications & Purchasing Controls */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-amber-700 mb-1">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Rating & Stock Status */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center text-amber-500 gap-1">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-neutral-800">{product.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-neutral-400">({product.reviews_count || 18} reviews)</span>
              </div>
              <span className="text-neutral-300">|</span>
              <span
                className={`font-semibold ${
                  isOutOfStock ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock} units available in stock`}
              </span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-bold text-neutral-900">
                ${product.price.toFixed(2)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-neutral-400 line-through">
                  ${product.original_price.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          {/* Variants Selector */}
          <div className="space-y-6 pt-4 border-t border-neutral-100">
            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Color: <span className="text-neutral-900 normal-case font-medium">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(c)}
                      className={`text-xs px-4 py-2 rounded-lg border font-medium transition-all ${
                        selectedColor === c
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Size: <span className="text-neutral-900 font-medium">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`w-11 h-11 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center ${
                        selectedSize === s
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center border border-neutral-200 rounded-xl bg-white w-32 justify-between px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="text-neutral-500 hover:text-neutral-900 font-bold px-2 disabled:opacity-30"
                >
                  -
                </button>
                <span className="text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="text-neutral-500 hover:text-neutral-900 font-bold px-2 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={`flex-1 py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  isOutOfStock
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Shopping Bag!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    {isOutOfStock ? 'Sold Out' : adding ? 'Adding...' : 'Add to Bag'}
                  </>
                )}
              </button>
            </div>

            {/* Consult Aura AI about this piece */}
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="text-xs text-amber-900 font-medium">
                  Wondering how to style or pair this {product.category.toLowerCase()}?
                </span>
              </div>
              <button
                onClick={() =>
                  quickAsk(
                    `How should I style the ${product.title}? What matching shoes or accessories in your store would pair well?`
                  )
                }
                className="text-xs font-semibold text-amber-800 underline hover:text-amber-950 ml-2"
              >
                Ask Stylist
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-400" />
                <span>Complimentary shipping over $100</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-neutral-400" />
                <span>Free 30-day returns & exchanges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
