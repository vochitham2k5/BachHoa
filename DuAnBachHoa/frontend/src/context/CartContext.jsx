import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart:v1';

function getId(item) {
  return item?.id ?? item?._id ?? item?.sku ?? item?.code;
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return action.payload || { items: [] };
    }
    case 'ADD': {
      const { product, qty } = action.payload;
      const id = getId(product);
      if (!id) return state;
      const items = [...state.items];
      const idx = items.findIndex((i) => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + qty };
      } else {
        items.push({
          id,
          name: product.name,
          price: Number(product.price) || 0,
          image: product.images?.[0] || product.image || null,
          qty,
        });
      }
      return { ...state, items };
    }
    case 'UPDATE_QTY': {
      const { id, qty } = action.payload;
      const items = state.items
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
        .filter((i) => i.qty > 0);
      return { ...state, items };
    }
    case 'REMOVE': {
      const id = action.payload;
      return { ...state, items: state.items.filter((i) => i.id !== id) };
    }
    case 'CLEAR': {
      return { items: [] };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  // init from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'INIT', payload: JSON.parse(raw) });
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          dispatch({ type: 'INIT', payload: JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = (product, qty = 1) => dispatch({ type: 'ADD', payload: { product, qty } });
  const removeItem = (id) => dispatch({ type: 'REMOVE', payload: id });
  const updateQty = (id, qty) => dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
  const increase = (id, step = 1) => {
    const item = state.items.find((i) => i.id === id);
    if (item) updateQty(id, item.qty + step);
  };
  const decrease = (id, step = 1) => {
    const item = state.items.find((i) => i.id === id);
    if (item) updateQty(id, item.qty - step);
  };
  const clear = () => dispatch({ type: 'CLEAR' });

  const totals = useMemo(() => {
    const itemCount = state.items.reduce((s, i) => s + i.qty, 0);
    const subtotal = state.items.reduce((s, i) => s + i.qty * (Number(i.price) || 0), 0);
    return { itemCount, subtotal };
  }, [state.items]);

  const value = useMemo(() => ({
    items: state.items,
    addItem,
    removeItem,
    updateQty,
    increase,
    decrease,
    clear,
    totals,
  }), [state.items, totals]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
