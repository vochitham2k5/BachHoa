import api from './api';

export async function createPaymentIntent(orderId) {
  const { data } = await api.post('/payments/intent/', { order_id: orderId });
  return data; // { payment_id, payment_url }
}

export async function confirmPayment(paymentId) {
  const { data } = await api.post('/payments/webhook/', { payment_id: paymentId });
  return data; // { detail: 'ok' }
}
