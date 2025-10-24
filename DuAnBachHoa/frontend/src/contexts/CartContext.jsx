import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartCtx = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const storageKey = user ? `cart_items_${user.id}` : 'cart_items_guest';
  const [items, setItems] = useState(() => {
    // Không cho giỏ hàng khách vãng lai: nếu chưa đăng nhập, mặc định rỗng
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(`cart_items_${user.id}`) || '[]'); } catch { return []; }
  });

  // Khi đổi người dùng, nạp giỏ hàng theo tài khoản
  useEffect(() => {
    if (!user) { setItems([]); return; }
    try { setItems(JSON.parse(localStorage.getItem(`cart_items_${user.id}`) || '[]')); }
    catch { setItems([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Lưu giỏ hàng theo từng tài khoản
  useEffect(() => {
    if (!user) return; // Không lưu cho khách
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey, user]);

  const addItem = (product, qty = 1) => {
    if (!user) {
      const err = new Error('LOGIN_REQUIRED');
      err.code = 'LOGIN_REQUIRED';
      throw err;
    }
    setItems(prev => {
      const idx = prev.findIndex(x => x.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.sale_price ?? product.price,
        qty,
        sellerId: product.seller_id || product.sellerId,
      }];
    });
  };
  const removeItem = (id) => setItems(prev => prev.filter(x => x.id !== id));
  const updateQty = (id, qty) => setItems(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, qty) } : x));
  const clearCart = () => setItems([]);

  const total = useMemo(() => items.reduce((s, x) => s + x.price * x.qty, 0), [items]);
  const value = useMemo(() => ({ items, addItem, removeItem, updateQty, clearCart, total }), [items, total]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => useContext(CartCtx);
