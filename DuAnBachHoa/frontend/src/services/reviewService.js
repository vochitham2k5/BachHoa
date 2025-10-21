import api from './api';

export async function listReviews(productId) {
  const { data } = await api.get(`/reviews/?product=${productId}`);
  return data;
}

export async function createReview(productId, rating, comment) {
  const { data } = await api.post('/reviews/', { product: productId, rating, comment });
  return data;
}

export async function replyReview(reviewId, reply) {
  const { data } = await api.post(`/reviews/${reviewId}/reply/`, { reply });
  return data;
}

export async function updateReview(reviewId, payload) {
  // payload can be { rating, comment } for buyer or { seller_reply } for seller/admin
  const { data } = await api.patch(`/reviews/${reviewId}/`, payload);
  return data;
}

export async function deleteReview(reviewId) {
  await api.delete(`/reviews/${reviewId}/`);
}

export async function setReplyVisibility(reviewId, hidden) {
  const { data } = await api.post(`/reviews/${reviewId}/reply-visibility/`, { hidden });
  return data;
}
