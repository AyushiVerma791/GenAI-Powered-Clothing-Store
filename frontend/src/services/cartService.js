import { apiRequest } from './api';

export const cartService = {
  async getCart() {
    return await apiRequest('/cart');
  },

  async addItem(productId, quantity, size, color) {
    return await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity,
        size,
        color,
      }),
    });
  },

  async updateQuantity(productId, quantity, size, color) {
    const query = new URLSearchParams({ size, color }).toString();
    return await apiRequest(`/cart/items/${productId}?${query}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async removeItem(productId, size, color) {
    const query = new URLSearchParams({ size, color }).toString();
    return await apiRequest(`/cart/items/${productId}?${query}`, {
      method: 'DELETE',
    });
  },

  async clearCart() {
    return await apiRequest('/cart', {
      method: 'DELETE',
    });
  },
};
