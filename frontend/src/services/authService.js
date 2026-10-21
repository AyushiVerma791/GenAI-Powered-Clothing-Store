import { apiRequest } from './api';

export const authService = {
  async register(email, full_name, password) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name, password }),
    });
  },

  async login(email, password) {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return await apiRequest('/auth/me');
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};
