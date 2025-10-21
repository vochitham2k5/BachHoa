import api from './api';

export async function listUsers(params={}) {
  const { data } = await api.get('/users/', { params });
  return data;
}

export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/users/${id}/`, { role });
  return data;
}

export async function listAllProducts(params={}) {
  const { data } = await api.get('/products/', { params });
  return data;
}

export async function setProductActive(id, is_active) {
  const { data } = await api.patch(`/products/${id}/`, { is_active });
  return data;
}

export async function listAllShipments(params={}) {
  const { data } = await api.get('/shipments/', { params });
  return data;
}

export async function assignShipment(id, assignee) {
  const { data } = await api.patch(`/shipments/${id}/`, { assignee });
  return data;
}

export async function listAuditLogs(params={}) {
  const { data } = await api.get('/audit-logs/', { params });
  return data;
}
