import { apiRequest } from './api';

export const productService = {
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.query) query.append('query', params.query);
    if (params.category) query.append('category', params.category);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.size) query.append('size', params.size);
    if (params.color) query.append('color', params.color);
    if (params.sort) query.append('sort', params.sort);
    if (params.is_featured !== undefined) query.append('is_featured', params.is_featured);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    return await apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
  },

  async getProductById(id) {
    return await apiRequest(`/products/${id}`);
  },

  async getCategories() {
    return await apiRequest('/products/categories');
  },
};
