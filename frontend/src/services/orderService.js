import { apiRequest } from './api';

export const orderService = {
  async createOrder(shippingAddress, paymentMethod = 'mock_card') {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        from_cart: true,
      }),
    });
  },

  async getMyOrders(page = 1, limit = 10) {
    return await apiRequest(`/orders?page=${page}&limit=${limit}`);
  },

  async getOrderById(id) {
    return await apiRequest(`/orders/${id}`);
  },
};
