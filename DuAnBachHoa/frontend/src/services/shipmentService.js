import api from './api';

export async function listShipments() {
  const { data } = await api.get('/shipments/');
  return data;
}

export async function transitionShipment(id, status) {
  const { data } = await api.post(`/shipments/${id}/transition/`, { status });
  return data;
}

export async function updateShipment(id, payload) {
  // payload can include: note, gps_lat, gps_lng, photo (File)
  const form = new FormData();
  if (payload.note != null) form.append('note', payload.note);
  if (payload.gps_lat != null) form.append('gps_lat', payload.gps_lat);
  if (payload.gps_lng != null) form.append('gps_lng', payload.gps_lng);
  if (payload.photo) form.append('photo', payload.photo);
  const { data } = await api.patch(`/shipments/${id}/`, form);
  return data;
}
