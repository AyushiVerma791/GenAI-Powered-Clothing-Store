import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1, size = 'M', color = 'Default') => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add items to your cart.');
    }
    const updated = await cartService.addItem(productId, quantity, size, color);
    setCart(updated);
    return updated;
  };

  const updateQuantity = async (productId, quantity, size, color) => {
    const updated = await cartService.updateQuantity(productId, quantity, size, color);
    setCart(updated);
    return updated;
  };

  const removeFromCart = async (productId, size, color) => {
    const updated = await cartService.removeItem(productId, size, color);
    setCart(updated);
    return updated;
  };

  const clearCart = async () => {
    await cartService.clearCart();
    setCart((prev) => (prev ? { ...prev, items: [], total_items: 0, subtotal: 0, total: 0 } : null));
  };

  const itemCount = cart?.total_items || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
