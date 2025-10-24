import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export function useApiGet(url, { params, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetcher = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), enabled]);

  useEffect(() => { fetcher(); }, [fetcher]);
  return { data, loading, error, refetch: fetcher };
}

export function useApiPost(url) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const post = useCallback(async (payload) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post(url, payload);
      setData(res.data);
      return res.data;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { post, loading, error, data };
}
