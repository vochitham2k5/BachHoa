import api from './api';

export const createOrder = async (items, addressId, voucherCode) => {
  const payload = { items: items.map(i => ({ product_id: i.id, qty: i.qty })) };
  if (addressId) payload.address_id = addressId;
  if (voucherCode) payload.voucher_code = voucherCode;
  const { data } = await api.post('/orders/', payload);
  return data;
};

export const listOrders = async () => {
  const { data } = await api.get('/orders/');
  return data;
};
