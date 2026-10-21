import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowUpRight, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';

export default function ChatProductCard({ item }) {
  const { addToCart } = useCart();
  const { closeChat } = useChat();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    try {
      setAdding(true);
      const defaultSize = item.sizes?.[0] || 'M';
      const defaultColor = item.colors?.[0] || 'Default';
      await addToCart(item.id, 1, defaultSize, defaultColor);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex gap-3 items-center group">
      <Link
        to={`/products/${item.id}`}
        onClick={closeChat}
        className="w-16 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 relative block"
      >
        <img
          src={item.image || '/placeholder.png'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <Link
            to={`/products/${item.id}`}
            onClick={closeChat}
            className="text-xs font-semibold text-neutral-900 truncate hover:text-amber-800 transition-colors"
          >
            {item.title}
          </Link>
          <span className="text-xs font-bold text-neutral-900">
            ${item.price?.toFixed(2)}
          </span>
        </div>

        <p className="text-[11px] text-amber-700 italic mt-0.5 line-clamp-2">
          {item.match_reason || 'Matches your style request'}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
          <Link
            to={`/products/${item.id}`}
            onClick={closeChat}
            className="text-[10px] font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-0.5"
          >
            Details <ArrowUpRight className="w-3 h-3" />
          </Link>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
              added
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-2.5 h-2.5" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-2.5 h-2.5" /> {adding ? 'Adding...' : 'Add'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
