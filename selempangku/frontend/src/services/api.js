import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const productService = {
  getAll: (params) => api.get('/products/public', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
  getAllAdmin: (params) => api.get('/products', { params })
};

export const orderService = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getStatistics: () => api.get('/orders/statistics'),
  getRecent: () => api.get('/orders/recent')
};

export const paymentService = {
  create: (data) => api.post('/payments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyPayments: () => api.get('/payments/my-payments'),
  getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
  getById: (id) => api.get(`/payments/${id}`),
  getAll: (params) => api.get('/payments', { params }),
  verify: (id) => api.put(`/payments/${id}/verify`),
  reject: (id, notes) => api.put(`/payments/${id}/reject`, { notes })
};

export const accountService = {
  getActive: () => api.get('/accounts/active'),
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  toggle: (id) => api.put(`/accounts/${id}/toggle`)
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getMembers: () => api.get('/users/members'),
  deleteMember: (id) => api.delete(`/users/members/${id}`)
};

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getTransactions: (params) => api.get('/reports/transactions', { params }),
  getChart: (params) => api.get('/reports/chart', { params })
};

export default api;
