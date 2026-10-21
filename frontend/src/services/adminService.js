import { apiRequest } from './api';

export const adminService = {
  async createProduct(productData) {
    return await apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(productId, productData) {
    return await apiRequest(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(productId) {
    return await apiRequest(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest('/admin/upload-image', {
      method: 'POST',
      body: formData,
    });
  },

  async listAllOrders(page = 1, limit = 20) {
    return await apiRequest(`/admin/orders?page=${page}&limit=${limit}`);
  },

  async updateOrderStatus(orderId, orderStatus, paymentStatus) {
    return await apiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        order_status: orderStatus,
        payment_status: paymentStatus,
      }),
    });
  },
};
