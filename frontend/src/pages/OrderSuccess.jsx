import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { orderService } from '../services/orderService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    async function loadOrder() {
      if (!order && id) {
        try {
          const data = await orderService.getOrderById(id);
          setOrder(data);
        } catch (err) {
          console.error('Failed to load order:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadOrder();
  }, [id, order]);

  if (loading) return <LoadingSpinner text="Loading order confirmation..." />;
  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="font-serif text-3xl font-bold">Order Received</h2>
        <p className="text-xs text-neutral-500">Thank you for your purchase.</p>
        <Link
          to="/orders"
          className="inline-block px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold"
        >
          View Order History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-neutral-900">
          Order Successfully Placed!
        </h1>
        <p className="text-sm text-neutral-500">
          Thank you for choosing AURA. Your order number is{' '}
          <strong className="text-neutral-900 font-mono">{order.order_number}</strong>.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 pb-4 gap-2 text-xs">
          <div>
            <span className="text-neutral-400">Order Status: </span>
            <span className="font-bold text-emerald-700 uppercase tracking-wider">
              {order.order_status}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Payment: </span>
            <span className="font-bold text-neutral-800 uppercase tracking-wider">
              {order.payment_method} ({order.payment_status})
            </span>
          </div>
        </div>

        {/* Ordered Items Snapshots */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Purchased Garments
          </h3>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="w-12 h-14 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium text-neutral-900">{item.title}</p>
                    <p className="text-neutral-400 text-[11px]">
                      Qty: {item.quantity} &bull; Size: {item.size} &bull; Color: {item.color}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-neutral-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sales Tax</span>
            <span className="font-semibold text-neutral-900">${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-neutral-900">
              {order.shipping_fee === 0 ? 'FREE' : `$${order.shipping_fee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
            <span>Total Paid</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="border-t border-neutral-100 pt-4 text-xs text-neutral-600 space-y-1">
          <h4 className="font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            Shipping Destination
          </h4>
          <p className="font-medium text-neutral-900">{order.shipping_address.full_name}</p>
          <p>{order.shipping_address.address_line1}</p>
          {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
          <p>
            {order.shipping_address.city}, {order.shipping_address.state}{' '}
            {order.shipping_address.postal_code}
          </p>
          <p>{order.shipping_address.country}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        <Link
          to="/orders"
          className="px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors text-center"
        >
          View All Orders
        </Link>
        <Link
          to="/shop"
          className="px-6 py-3 border border-neutral-300 text-neutral-800 rounded-full text-xs font-semibold hover:bg-neutral-50 transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
