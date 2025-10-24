import { useEffect, useState } from 'react';
import api from '../../services/api';

export function useShipperTasks(status) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get('/api/shipper/tasks/', { params: { status } });
        if (!cancel) setItems(res.data || []);
      } catch (e) {
        if (!cancel) setError(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [status]);

  return { items, loading, error };
}

export function useTaskActions() {
  const accept = async (orderId) => {
    try {
      await api.put(`/api/shipper/tasks/${orderId}/status`, { status: 'ACCEPTED' });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
  const updateStatus = async (orderId, status, payload = {}) => {
    try {
      await api.put(`/api/shipper/tasks/${orderId}/status`, { status, ...payload });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  };
  return { accept, updateStatus };
}
