import { useEffect, useState } from 'react';
import api from '../../services/api';

export function useSellerOrdersCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await api.get('/api/seller/orders/');
        if (!cancel) setCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        if (!cancel) setCount(0);
      }
    })();
    return () => { cancel = true; };
  }, []);
  return { count };
}
