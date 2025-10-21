import api from './api.js';

export const fetchProducts = (params) => api.get('/products', { params }).then(r => r.data);
export const fetchProduct = (id) => api.get(`/products/${id}`).then(r => r.data);
export const createProduct = (payload) => api.post('/products', payload).then(r => r.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);
