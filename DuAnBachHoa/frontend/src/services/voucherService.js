import api from './api';

export async function listActiveVouchers() {
  const { data } = await api.get('/vouchers/');
  return data;
}

export async function createVoucher(payload) {
  const { data } = await api.post('/vouchers/', payload);
  return data;
}
