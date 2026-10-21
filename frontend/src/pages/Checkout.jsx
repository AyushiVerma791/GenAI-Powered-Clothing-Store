import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import ErrorAlert from '../components/common/ErrorAlert';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('mock_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart?.items?.length) {
      setError('Your shopping bag is empty.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const order = await orderService.createOrder(address, paymentMethod);
      navigate(`/order-success/${order.id}`, { state: { order } });
    } catch (err) {
      setError(err.message || 'Failed to place order. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="font-serif text-4xl font-bold text-neutral-900 border-b border-neutral-200 pb-6">
        Checkout & Shipping
      </h1>

      <ErrorAlert message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left 2 Cols: Shipping Details & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-5">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              1. Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="e.g. Jane Doe"
                  value={address.full_name}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  placeholder="Street address or P.O. Box"
                  value={address.address_line1}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Apt, Suite, Unit (Optional)
                </label>
                <input
                  type="text"
                  name="address_line2"
                  placeholder="Apt 4B"
                  value={address.address_line2}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="New York"
                  value={address.city}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  State / Province *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="NY"
                  value={address.state}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  placeholder="10001"
                  value={address.postal_code}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={address.phone}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              2. Payment Method
            </h2>
            <p className="text-xs text-neutral-500">
              This application operates in simulated checkout mode for demonstration and testing. No real card details are collected.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label
                className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'mock_card'
                    ? 'border-neutral-900 bg-neutral-50/70 ring-1 ring-neutral-900'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mock_card"
                  checked={paymentMethod === 'mock_card'}
                  onChange={() => setPaymentMethod('mock_card')}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-900">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>Instant Mock Card</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Simulates immediate payment approval and marks order as Paid.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-neutral-900 bg-neutral-50/70 ring-1 ring-neutral-900'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-900">
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    <span>Cash on Delivery</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Order is placed in Pending Payment status until delivered.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Verified Order Review */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6 h-fit">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 border-b border-neutral-100 pb-4">
            Items in Bag
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart?.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <img
                  src={item.image || '/placeholder.png'}
                  alt={item.title}
                  className="w-12 h-14 object-cover rounded-md flex-shrink-0 bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{item.title}</p>
                  <p className="text-neutral-400 text-[11px]">
                    Qty: {item.quantity} &bull; {item.size} &bull; {item.color}
                  </p>
                </div>
                <span className="font-semibold text-neutral-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-neutral-600 pt-4 border-t border-neutral-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">${cart?.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax (8%)</span>
              <span className="font-semibold text-neutral-900">${cart?.estimated_tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-neutral-900">
                {cart?.estimated_shipping === 0 ? 'FREE' : `$${cart?.estimated_shipping?.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-900">
              <span>Total</span>
              <span>${cart?.total?.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !cart?.items?.length}
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Processing Order...' : 'Confirm & Place Order'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
