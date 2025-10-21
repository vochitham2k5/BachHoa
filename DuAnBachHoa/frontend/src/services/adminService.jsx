import api from './api.js';

export const listUsers = (params) => api.get('/users/', { params }).then(r => r.data);
export const updateUserRole = (id, role) => api.patch(`/users/${id}/`, { role }).then(r => r.data);
