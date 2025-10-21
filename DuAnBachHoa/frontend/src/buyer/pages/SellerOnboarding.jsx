import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function SellerOnboarding() {
  const [profile, setProfile] = useState(null);
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/seller-profiles/?mine=1');
      if (data && data.length) {
        setProfile(data[0]);
        setShopName(data[0].shop_name || '');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!shopName) return alert('Nhập tên shop');
    if (profile) return alert('Đã gửi hồ sơ. Trạng thái: ' + profile.kyc_status);
    const { data } = await api.post('/seller-profiles/', { shop_name: shopName });
    setProfile(data);
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 520 }}>
      <h3>Trở thành người bán</h3>
      {profile ? (
        <div>
          <div>Tên shop: {profile.shop_name}</div>
          <div>Trạng thái: {profile.kyc_status}</div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Tên shop
            <input value={shopName} onChange={(e)=>setShopName(e.target.value)} />
          </label>
          <button type="submit">Gửi hồ sơ</button>
        </form>
      )}
    </div>
  );
}
