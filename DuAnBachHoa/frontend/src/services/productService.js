import api from './api';

export const listPublicProducts = async (params={}) => {
  const { data } = await api.get('/products/', { params });
  return data;
};

export const listSellerProducts = async () => {
  const { data } = await api.get('/seller/products/');
  return data;
};

export const createSellerProduct = async (payload) => {
  // For image upload, use multipart
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => form.append(k, v));
  const { data } = await api.post('/seller/products/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

export const updateSellerProduct = async (id, payload) => {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => form.append(k, v));
  const { data } = await api.patch(`/seller/products/${id}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

export const deleteSellerProduct = async (id) => {
  await api.delete(`/seller/products/${id}/`);
};

export const fetchProduct = async (id) => {
  const { data } = await api.get(`/products/${id}/`);
  return data;
};

export const fetchProductsByIds = async (ids=[]) => {
  if (!ids.length) return [];
  const { data } = await api.get('/products/', { params: { ids: ids.join(',') } });
  return data;
};
