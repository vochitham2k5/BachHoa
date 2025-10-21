import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import api from '../../services/api';
import { listActiveVouchers } from '../../services/voucherService';
import { fetchProductsByIds } from '../../services/productService';

export default function BuyerCheckout() {
  const { items, clearCart, total } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [voucher, setVoucher] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [cartProducts, setCartProducts] = useState({}); // id -> product detail (incl. seller)
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/addresses/');
        setAddresses(data);
        const def = data.find(a => a.is_default);
        if (def) setAddressId(String(def.id));
        const vs = await listActiveVouchers();
        setVouchers(vs);
        // fetch product details for items in cart so we can show eligible items per voucher
        const ids = items.map(i => i.id);
        if (ids.length) {
          const prods = await fetchProductsByIds(ids);
          const map = {};
          prods.forEach(p => { map[p.id] = p; });
          setCartProducts(map);
        } else {
          setCartProducts({});
        }
      } catch (e) { console.error(e); }
    })();
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    if (!items.length) return alert('Giỏ hàng trống');
    setSubmitting(true);
    try {
    // Đơn giản: gửi order không lưu sổ địa chỉ (BE vẫn hỗ trợ address_id nếu đã có)
  const order = await createOrder(items, addressId ? Number(addressId) : undefined, voucher || undefined);
      clearCart();
    navigate('/orders');
    } catch (err) {
      console.error(err);
      alert('Tạo đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <h3>Thanh toán</h3>
      <div>Tổng tiền: {total.toLocaleString()} đ</div>
      <label>
        Mã giảm giá:
        <input value={voucher} onChange={(e)=>setVoucher(e.target.value)} placeholder="VOUCHER" />
      </label>
      {!!vouchers.length && (
        <div>
          <small>Mã đang có:</small>
          <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
            {vouchers.map(v => {
              const nearExpiry = v.end_at ? (new Date(v.end_at).getTime() - Date.now()) <= 3*24*3600*1000 : false;
              const quotaWarn = v.usage_limit != null && v.usage_limit > 0 && (v.used_count / v.usage_limit) >= 0.8;
              const eligibleItems = v.seller ? items.filter(it => cartProducts[it.id]?.seller === v.seller) : items;
              return (
                <div key={v.id} style={{ display:'flex', flexDirection:'column', gap: 2, padding:'6px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <button type="button" onClick={() => setVoucher(v.code)}>{v.code}</button>
                    <span>
                      {v.discount_type === 'percent' ? `${v.value}%` : `${Number(v.value).toLocaleString()} đ`} 
                      {v.start_at && v.end_at && ` | ${new Date(v.start_at).toLocaleDateString()} - ${new Date(v.end_at).toLocaleDateString()}`}
                      {v.usage_limit != null && ` | Dùng: ${v.used_count}/${v.usage_limit}`}
                      {v.seller && v.seller_username && ` | Chỉ áp dụng cho shop: ${v.seller_username}`}
                    </span>
                  </div>
                  {!!eligibleItems.length && v.seller && (
                    <small>
                      Áp dụng cho: {eligibleItems.map(e => cartProducts[e.id]?.name || e.id).join(', ')}
                    </small>
                  )}
                  {(nearExpiry || quotaWarn) && (
                    <small style={{ color:'#b54708' }}>
                      {nearExpiry && 'Sắp hết hạn; '} {quotaWarn && 'Gần đạt giới hạn lượt dùng.'}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <label>
        Địa chỉ giao hàng:
        <select value={addressId} onChange={(e)=>setAddressId(e.target.value)}>
          <option value="">-- Chọn --</option>
          {addresses.map(a => (
            <option key={a.id} value={a.id}>{a.line1} {a.ward && ', ' + a.ward}</option>
          ))}
        </select>
      </label>
  <small>Quản lý sổ địa chỉ ở trang Buyer &gt; Addresses</small>

      <button type="submit" disabled={submitting}>Đặt hàng</button>
    </form>
  );
}
