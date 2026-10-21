import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="font-serif text-3xl font-bold text-neutral-900">Your Shopping Bag</h2>
        <p className="text-sm text-neutral-500">
          Please sign in to view and manage your shopping cart.
        </p>
        <Link
          to="/login?redirect=/cart"
          className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading && !cart) {
    return <LoadingSpinner text="Retrieving your shopping bag..." />;
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="font-serif text-3xl font-bold text-neutral-900">Your Bag is Empty</h2>
        <p className="text-sm text-neutral-500">
          Looks like you haven&apos;t added any luxury pieces to your cart yet.
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
        <h1 className="font-serif text-4xl font-bold text-neutral-900">Shopping Bag</h1>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-400 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Empty bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.product_id}-${item.size}-${item.color}-${idx}`}
              className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Link
                  to={`/products/${item.product_id}`}
                  className="w-20 h-24 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0"
                >
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="space-y-1">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="font-medium text-sm text-neutral-900 hover:text-amber-800 transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>Size: <strong className="text-neutral-700">{item.size}</strong></span>
                    <span>&bull;</span>
                    <span>Color: <strong className="text-neutral-700">{item.color}</strong></span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 pt-1">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                <div className="flex items-center border border-neutral-200 rounded-lg bg-white px-2 py-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity - 1, item.size, item.color)
                    }
                    className="text-neutral-500 hover:text-neutral-900 font-bold px-2 text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold px-2">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product_id, item.quantity + 1, item.size, item.color)
                    }
                    disabled={item.quantity >= item.stock_available}
                    className="text-neutral-500 hover:text-neutral-900 font-bold px-2 text-xs disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-bold text-neutral-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                  className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/shop"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-900 pt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
          </Link>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6 h-fit">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 border-b border-neutral-100 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal ({cart.total_items} items)</span>
              <span className="font-semibold text-neutral-900">${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Sales Tax (8%)</span>
              <span className="font-semibold text-neutral-900">${cart.estimated_tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span>Standard Shipping</span>
                {cart.estimated_shipping === 0 && (
                  <span className="ml-1 text-[10px] text-emerald-600 font-semibold">(Free &gt; $100)</span>
                )}
              </div>
              <span className="font-semibold text-neutral-900">
                {cart.estimated_shipping === 0 ? 'FREE' : `$${cart.estimated_shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-900">
              <span>Estimated Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
