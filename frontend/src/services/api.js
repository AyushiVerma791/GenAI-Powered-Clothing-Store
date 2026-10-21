const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If body is FormData (e.g. file upload), browser must set boundary automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Token is invalid/expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.detail || `HTTP Error ${response.status}: ${response.statusText}`;
      const error = new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(err.message || 'Network error communicating with the server.');
  }
}
