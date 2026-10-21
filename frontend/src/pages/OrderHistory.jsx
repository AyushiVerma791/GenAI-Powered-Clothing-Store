import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ChevronRight } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OrderHistory() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const res = await orderService.getMyOrders(1, 20);
        setOrders(res.items || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated]);

  if (loading) return <LoadingSpinner text="Retrieving your order history..." />;

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <Package className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="font-serif text-3xl font-bold">No Orders Yet</h2>
        <p className="text-xs text-neutral-500">
          You haven&apos;t placed any orders with us yet.
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="font-serif text-4xl font-bold text-neutral-900">Your Order History</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Review historical purchases and live shipment tracking statuses
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5"
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 pb-4 gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">
                    Order Number
                  </span>
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {order.order_number}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">
                    Date Placed
                  </span>
                  <span className="text-neutral-700">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full ${getStatusColor(
                    order.order_status
                  )}`}
                >
                  {order.order_status}
                </span>
                <span className="font-bold text-neutral-900 text-sm">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Items row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-2 bg-neutral-50 rounded-xl border border-neutral-100"
                >
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="w-12 h-14 object-cover rounded-lg bg-neutral-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-neutral-500">
                      Qty: {item.quantity} &bull; {item.size}
                    </p>
                    <p className="text-xs font-bold text-neutral-800">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 text-xs text-neutral-500">
              <span>
                Shipping to: <strong>{order.shipping_address.city}, {order.shipping_address.state}</strong>
              </span>
              <span className="capitalize">Payment: {order.payment_method.replace('_', ' ')} ({order.payment_status})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
